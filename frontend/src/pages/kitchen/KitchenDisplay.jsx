import React, { useEffect, useMemo, useState } from "react";
import io from "socket.io-client";
import API from "../../api/axios";
import {
  AlertCircle,
  ChefHat,
  Check,
  Clock,
  Flame,
  RefreshCw,
  Search,
  Wifi,
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const getId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
};

const getTableName = (order) => {
  const table = order?.table;

  if (!table) return "Takeaway";

  return (
    table.tableNumber ||
    table.tableName ||
    table.name ||
    table.number ||
    table.title ||
    `T-${String(getId(table)).slice(-4)}`
  );
};

const getItemId = (item) => {
  return getId(item) || getId(item?.product);
};

const getItemName = (item) => {
  return (
    item?.name ||
    item?.product?.name ||
    item?.product?.productName ||
    item?.productName ||
    "Item"
  );
};

const getItemCategoryId = (item) => {
  return (
    getId(item?.product?.category) ||
    getId(item?.category) ||
    item?.categoryId ||
    ""
  );
};

const normalizeKitchenStatus = (status) => {
  const value = String(status || "to_cook").toLowerCase();

  if (value === "pending") return "to_cook";

  return value;
};

const getKitchenLabel = (status) => {
  const value = normalizeKitchenStatus(status);

  if (value === "to_cook") return "To Cook";
  if (value === "preparing") return "Preparing";
  if (value === "completed") return "Completed";

  return value;
};

const getNextKitchenStatus = (status) => {
  const value = normalizeKitchenStatus(status);

  if (value === "to_cook") return "preparing";
  if (value === "preparing") return "completed";

  return "completed";
};

const upsertOrder = (orders, incomingOrder) => {
  if (!incomingOrder?._id) return orders;

  const shouldRemove =
    incomingOrder.status === "paid" || incomingOrder.status === "cancelled";

  if (shouldRemove) {
    return orders.filter((order) => order._id !== incomingOrder._id);
  }

  const exists = orders.some((order) => order._id === incomingOrder._id);

  if (exists) {
    return orders.map((order) =>
      order._id === incomingOrder._id ? incomingOrder : order
    );
  }

  return [...orders, incomingOrder];
};

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTimes, setCurrentTimes] = useState({});
  const [completedCount, setCompletedCount] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    fetchActiveKitchenOrders();
    fetchCategories();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("order_sent_to_kitchen", (newOrder) => {
      setOrders((prev) => upsertOrder(prev, newOrder));
    });

    socket.on("order_updated", (updatedOrder) => {
      setOrders((prev) => upsertOrder(prev, updatedOrder));
    });

    socket.on("kitchen_status_updated", (updatedOrder) => {
      setOrders((prev) => {
        const oldOrder = prev.find((order) => order._id === updatedOrder._id);

        if (
          updatedOrder.kitchenStatus === "completed" &&
          oldOrder?.kitchenStatus !== "completed"
        ) {
          setCompletedCount((count) => count + 1);
        }

        return upsertOrder(prev, updatedOrder);
      });
    });

    socket.on("order_cancelled", (cancelledOrder) => {
      setOrders((prev) =>
        prev.filter((order) => order._id !== cancelledOrder._id)
      );
    });

    socket.on("order_paid", (paidOrder) => {
      setOrders((prev) => prev.filter((order) => order._id !== paidOrder._id));
    });

    socket.on("order_deleted", ({ orderId }) => {
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const times = {};

      orders.forEach((order) => {
        const diffMs = Date.now() - new Date(order.createdAt).getTime();
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);

        times[order._id] = {
          mins,
          secs,
          isLate: mins >= 15 && order.kitchenStatus !== "completed",
        };
      });

      setCurrentTimes(times);
    }, 1000);

    return () => clearInterval(timer);
  }, [orders]);

  const fetchActiveKitchenOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/orders/kitchen");
      const list = extractList(response, "orders");

      setOrders(list);
    } catch (err) {
      console.error("KDS fetch error:", err);
      setError("Failed to fetch kitchen orders. Check backend and MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories");
      const list = extractList(response, "categories");

      setCategories(list);
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const response = await API.put(`/orders/${orderId}/kitchen-status`, {
        kitchenStatus: status,
      });

      const updatedOrder =
        response?.data?.data || response?.data?.order || response?.data;

      if (updatedOrder?._id) {
        setOrders((prev) => {
          const oldOrder = prev.find((order) => order._id === updatedOrder._id);

          if (
            status === "completed" &&
            oldOrder?.kitchenStatus !== "completed"
          ) {
            setCompletedCount((count) => count + 1);
          }

          return upsertOrder(prev, updatedOrder);
        });
      }
    } catch (err) {
      console.error("KDS status update error:", err);
      alert(err.response?.data?.message || "Failed to update kitchen status.");
    }
  };

  const handleAdvanceStatus = (order) => {
    const nextStatus = getNextKitchenStatus(order.kitchenStatus);

    if (order.kitchenStatus === "completed") return;

    handleUpdateStatus(order._id, nextStatus);
  };

  const handleToggleItemComplete = async (orderId, item) => {
    const itemId = getItemId(item);

    if (!itemId) {
      alert("Item id missing. Please check order item schema.");
      return;
    }

    try {
      const response = await API.put(
        `/orders/${orderId}/items/${itemId}/toggle-complete`
      );

      const updatedOrder =
        response?.data?.data || response?.data?.order || response?.data;

      if (updatedOrder?._id) {
        setOrders((prev) => upsertOrder(prev, updatedOrder));
      }
    } catch (err) {
      console.error("KDS item completion error:", err);
      alert(err.response?.data?.message || "Failed to update item completion.");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const kitchenStatus = normalizeKitchenStatus(order.kitchenStatus);

      const matchesStatus =
        statusFilter === "all" || kitchenStatus === statusFilter;

      const matchesSearch =
        productSearchTerm.trim() === "" ||
        order.items?.some((item) =>
          getItemName(item)
            .toLowerCase()
            .includes(productSearchTerm.toLowerCase())
        );

      const matchesCategory =
        selectedCategoryFilter === "all" ||
        order.items?.some(
          (item) => String(getItemCategoryId(item)) === selectedCategoryFilter
        );

      return matchesStatus && matchesSearch && matchesCategory;
    });
  }, [orders, productSearchTerm, selectedCategoryFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      toCook: orders.filter(
        (order) => normalizeKitchenStatus(order.kitchenStatus) === "to_cook"
      ).length,
      preparing: orders.filter(
        (order) => normalizeKitchenStatus(order.kitchenStatus) === "preparing"
      ).length,
      completed: orders.filter(
        (order) => normalizeKitchenStatus(order.kitchenStatus) === "completed"
      ).length,
      late: orders.filter((order) => currentTimes[order._id]?.isLate).length,
    };
  }, [orders, currentTimes]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#08090f]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-xs text-slate-500">Loading kitchen queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-[#06080d] text-slate-100"
      style={{ fontFamily: "Inter,sans-serif" }}
    >
      {/* KDS Header */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/5 bg-[#0a0d15] px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-900/30">
            <ChefHat className="h-5 w-5 text-white" />
          </div>

          <div>
            <h1
              className="text-sm font-black text-white"
              style={{ fontFamily: "Outfit,sans-serif" }}
            >
              Kitchen Display System
            </h1>
            <p className="text-[9px] text-slate-500">
              Real-time order queue • CafeFlow KDS
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Stats */}
          <div className="hidden items-center space-x-3 md:flex">
            <div className="text-center">
              <div
                className="text-lg font-black text-amber-400"
                style={{ fontFamily: "JetBrains Mono,monospace" }}
              >
                {stats.total}
              </div>
              <div className="text-[8px] font-bold uppercase text-slate-500">
                Queue
              </div>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="text-center">
              <div
                className="text-lg font-black text-orange-400"
                style={{ fontFamily: "JetBrains Mono,monospace" }}
              >
                {stats.preparing}
              </div>
              <div className="text-[8px] font-bold uppercase text-slate-500">
                Preparing
              </div>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="text-center">
              <div
                className="text-lg font-black text-emerald-400"
                style={{ fontFamily: "JetBrains Mono,monospace" }}
              >
                {stats.completed}
              </div>
              <div className="text-[8px] font-bold uppercase text-slate-500">
                Ready
              </div>
            </div>

            <div className="h-8 w-px bg-white/5" />

            <div className="text-center">
              <div
                className="text-lg font-black text-red-400"
                style={{ fontFamily: "JetBrains Mono,monospace" }}
              >
                {stats.late}
              </div>
              <div className="text-[8px] font-bold uppercase text-slate-500">
                Late
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1.5 rounded-xl border px-2.5 py-1.5 ${
                socketConnected
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-red-500/20 bg-red-500/10"
              }`}
            >
              <Wifi
                className={`h-3 w-3 ${
                  socketConnected ? "text-emerald-400" : "text-red-400"
                }`}
              />
              <span
                className={`text-[9px] font-bold ${
                  socketConnected ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {socketConnected ? "Live Feed" : "Offline"}
              </span>
            </div>

            <button
              onClick={fetchActiveKitchenOrders}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              title="Refresh kitchen queue"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-shrink-0 flex-col gap-3 border-b border-white/5 bg-[#0a0d15]/50 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex w-full items-center rounded-xl border border-white/10 bg-[#0d1120] px-3 py-2 md:max-w-xs">
          <Search className="mr-2 h-4 w-4 text-slate-500" />

          <input
            type="text"
            placeholder="Search tickets by product..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: "all", label: "All" },
            { key: "to_cook", label: "To Cook" },
            { key: "preparing", label: "Preparing" },
            { key: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold transition-all ${
                statusFilter === tab.key
                  ? "border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedCategoryFilter("all")}
            className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold transition-all ${
              selectedCategoryFilter === "all"
                ? "border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            All Categories
          </button>

          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryFilter(cat._id)}
              className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold transition-all ${
                selectedCategoryFilter === cat._id
                  ? "border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {cat.name || cat.categoryName}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-[#0d1120]">
              <ChefHat className="h-12 w-12 text-slate-700" />
            </div>

            <h3
              className="mb-2 text-lg font-black text-slate-300"
              style={{ fontFamily: "Outfit,sans-serif" }}
            >
              Kitchen Queue Clear
            </h3>

            <p className="max-w-xs text-sm text-slate-500">
              No active orders match your selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => {
              const timer = currentTimes[order._id] || {
                mins: 0,
                secs: 0,
                isLate: false,
              };

              const kitchenStatus = normalizeKitchenStatus(order.kitchenStatus);
              const isLate = timer.isLate;
              const isPreparing = kitchenStatus === "preparing";
              const isToCook = kitchenStatus === "to_cook";
              const isCompleted = kitchenStatus === "completed";

              return (
                <div
                  key={order._id}
                  className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${
                    isCompleted
                      ? "border-emerald-500/45 bg-[#08140f] shadow-lg shadow-emerald-900/15"
                      : isLate
                      ? "border-red-500/50 bg-[#1a0d0d] shadow-lg shadow-red-900/20"
                      : isPreparing
                      ? "border-amber-500/40 bg-[#141009] shadow-lg shadow-amber-900/15"
                      : "border-white/10 bg-[#0d1120]"
                  }`}
                >
                  {/* Card Header */}
                  <button
                    type="button"
                    onClick={() => handleAdvanceStatus(order)}
                    disabled={isCompleted}
                    className={`border-b p-4 text-left transition ${
                      isCompleted
                        ? "cursor-default border-emerald-900/30 bg-emerald-950/20"
                        : isLate
                        ? "border-red-900/30 bg-red-950/30 hover:bg-red-950/40"
                        : isPreparing
                        ? "border-amber-900/25 bg-amber-950/25 hover:bg-amber-950/35"
                        : "border-white/5 bg-[#0b0d16] hover:bg-white/[0.04]"
                    }`}
                    title={
                      isCompleted
                        ? "Order completed and ready for cashier payment"
                        : "Click to move order to next kitchen stage"
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4
                          className="text-lg font-black uppercase tracking-tight text-white"
                          style={{ fontFamily: "Outfit,sans-serif" }}
                        >
                          {getTableName(order)}
                        </h4>

                        <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                          #{String(order.orderNumber || "").slice(-6)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`status-badge px-1.5 py-0.5 text-[8px] uppercase ${
                            isCompleted
                              ? "status-completed"
                              : isPreparing
                              ? "status-preparing"
                              : "status-pending bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {getKitchenLabel(kitchenStatus)}
                        </span>

                        <div
                          className={`mt-1 font-mono text-sm font-black ${
                            isCompleted
                              ? "text-emerald-400"
                              : isLate
                              ? "text-red-400"
                              : isPreparing
                              ? "text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          {timer.mins}m {timer.secs}s
                        </div>

                        {isLate && (
                          <p className="mt-0.5 text-[8px] font-bold text-red-500">
                            OVERDUE!
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Items */}
                  <div
                    className="flex-1 space-y-2.5 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ maxHeight: "250px" }}
                  >
                    {order.items?.map((item, index) => {
                      const isItemCompleted = Boolean(item.isCompleted);
                      const itemId = getItemId(item);

                      return (
                        <div key={itemId || index} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => handleToggleItemComplete(order._id, item)}
                            className="group flex w-full items-start space-x-2 py-0.5 text-left outline-none"
                            title="Click to mark item complete"
                          >
                            <span
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg border text-[9px] font-black transition-all ${
                                isItemCompleted
                                  ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
                                  : isPreparing
                                  ? "border-amber-500/30 bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/40"
                                  : "border-white/10 bg-white/10 text-white group-hover:bg-white/15"
                              }`}
                            >
                              {item.quantity || 1}
                            </span>

                            <span
                              className={`text-sm font-semibold leading-tight transition-all ${
                                isItemCompleted
                                  ? "italic text-slate-500 line-through"
                                  : "text-white group-hover:text-amber-400"
                              }`}
                            >
                              {getItemName(item)}
                            </span>
                          </button>

                          {item.notes && (
                            <div className="ml-7 flex items-start space-x-1.5 rounded-lg border border-amber-500/15 bg-amber-500/10 p-1.5">
                              <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                              <span className="text-[10px] italic leading-none text-amber-300">
                                "{item.notes}"
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action */}
                  <div className="border-t border-white/5 bg-[#0b0d16] p-3">
                    {isCompleted ? (
                      <div className="flex w-full items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-3 text-xs font-black uppercase tracking-wider text-emerald-400">
                        <Check className="mr-2 h-4 w-4" />
                        Ready for Payment
                      </div>
                    ) : isToCook ? (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "preparing")}
                        className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black uppercase tracking-wider text-slate-900 shadow-lg shadow-amber-900/30 transition-all hover:from-amber-400 hover:to-orange-400"
                      >
                        <Flame className="h-4 w-4" />
                        <span>Start Preparing</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order._id, "completed")}
                        className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 transition-all hover:from-emerald-500 hover:to-emerald-400"
                      >
                        <Check className="h-4 w-4" />
                        <span>Complete & Ready</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;