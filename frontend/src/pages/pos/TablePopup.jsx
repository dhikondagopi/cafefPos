import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  ArrowRight,
  Clock3,
  Grid3X3,
  HelpCircle,
  Layers,
  RefreshCw,
  Users,
} from "lucide-react";

import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { usePOS } from "../../context/POSContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.floors)) return data.floors;
  if (Array.isArray(data?.tables)) return data.tables;

  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const getFloorId = (table) => {
  return (
    getId(table?.floor) ||
    getId(table?.floorId) ||
    table?.floor ||
    table?.floorId ||
    ""
  );
};

const getFloorName = (floor) => {
  return floor?.name || floor?.floorName || floor?.title || `Floor`;
};

const getTableName = (table) => {
  return (
    table?.tableNumber ||
    table?.tableName ||
    table?.name ||
    table?.number ||
    table?.title ||
    `T-${String(table?._id || table?.id || "").slice(-4)}`
  );
};

const getTableSeats = (table) => {
  return (
    table?.capacity ||
    table?.seats ||
    table?.numberOfSeats ||
    table?.chairs ||
    table?.seatCount ||
    0
  );
};

const normalizeStatus = (status) => {
  return String(status || "available").toLowerCase();
};

const getStatusLabel = (status) => {
  const value = normalizeStatus(status);

  if (value === "available") return "Available";
  if (value === "occupied") return "Occupied";
  if (value === "payment_pending") return "Payment Pending";
  if (value === "reserved") return "Reserved";
  if (value === "inactive") return "Inactive";

  return value.replaceAll("_", " ");
};

const statusStyle = {
  available: {
    card:
      "border-emerald-500/40 bg-emerald-500/5 text-emerald-300 hover:border-emerald-400/80 hover:bg-emerald-500/10",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  occupied: {
    card:
      "border-red-500/40 bg-red-500/10 text-red-300 hover:border-red-400/80 hover:bg-red-500/15",
    dot: "bg-red-400 animate-pulse",
    badge: "bg-red-500/10 text-red-300 border-red-500/20",
  },
  payment_pending: {
    card:
      "border-sky-500/45 bg-sky-500/10 text-sky-300 hover:border-sky-400/80 hover:bg-sky-500/15",
    dot: "bg-sky-400 animate-pulse",
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  },
  reserved: {
    card:
      "border-amber-500/45 bg-amber-500/10 text-amber-300 hover:border-amber-400/80 hover:bg-amber-500/15",
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  inactive: {
    card:
      "cursor-not-allowed border-slate-700/70 bg-slate-900/60 text-slate-600 opacity-60",
    dot: "bg-slate-500",
    badge: "bg-slate-700/30 text-slate-500 border-slate-700/50",
  },
};

const getStatusStyle = (status) => {
  return statusStyle[normalizeStatus(status)] || statusStyle.available;
};

const TablePopup = () => {
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedFloorTab, setSelectedFloorTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { session } = useAuth();
  const { setActiveTable } = usePOS();

  const activeTables = useMemo(() => {
    if (selectedFloorTab === "all") return tables;

    return tables.filter((table) => getFloorId(table) === selectedFloorTab);
  }, [tables, selectedFloorTab]);

  const stats = useMemo(() => {
    return {
      available: activeTables.filter(
        (table) => normalizeStatus(table.status) === "available"
      ).length,
      occupied: activeTables.filter(
        (table) => normalizeStatus(table.status) === "occupied"
      ).length,
      paymentPending: activeTables.filter(
        (table) => normalizeStatus(table.status) === "payment_pending"
      ).length,
      reserved: activeTables.filter(
        (table) => normalizeStatus(table.status) === "reserved"
      ).length,
    };
  }, [activeTables]);

  const fetchFloorsAndTables = async () => {
    setLoading(true);
    setError("");

    try {
      const [floorRes, tableRes] = await Promise.all([
        API.get("/floors"),
        API.get("/tables"),
      ]);

      const floorList = extractList(floorRes, "floors");
      const tableList = extractList(tableRes, "tables");

      setFloors(floorList);
      setTables(tableList);

      if (floorList.length > 0) {
        setSelectedFloorTab("all");
      }
    } catch (err) {
      console.error("Failed to load floor layout:", err);
      setError("Failed to load floor layout. Please check backend and MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTable(null);
    fetchFloorsAndTables();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    const updateTableStatus = (tableId, status) => {
      if (!tableId) return;

      setTables((prev) =>
        prev.map((table) =>
          getId(table) === tableId ? { ...table, status } : table
        )
      );
    };

    socket.on("table_status_updated", ({ tableId, status }) => {
      updateTableStatus(tableId, status);
    });

    socket.on("order_paid", (order) => {
      const tableId = getId(order?.table) || order?.tableId;
      updateTableStatus(tableId, "available");
    });

    socket.on("order_sent_to_kitchen", (order) => {
      const tableId = getId(order?.table) || order?.tableId;
      updateTableStatus(tableId, "occupied");
    });

    socket.on("order_updated", (order) => {
      const tableId = getId(order?.table) || order?.tableId;

      if (
        order?.status === "sent_to_kitchen" &&
        order?.kitchenStatus === "completed"
      ) {
        updateTableStatus(tableId, "payment_pending");
      }

      if (order?.status === "paid") {
        updateTableStatus(tableId, "available");
      }
    });

    socket.on("order_cancelled", (order) => {
      const tableId = getId(order?.table) || order?.tableId;
      updateTableStatus(tableId, "available");
    });

    return () => socket.disconnect();
  }, []);

  const handleTableSelect = async (table) => {
    const status = normalizeStatus(table?.status);

    if (status === "inactive") return;

    if (!session) {
      navigate("/pos/open-session");
      return;
    }

    setActiveTable(table);
    localStorage.setItem("cafeflow_current_table", JSON.stringify(table));
    window.dispatchEvent(new Event("cafeflow_table_changed"));

    try {
      const response = await API.get(`/orders/active-table/${getId(table)}`);

      const activeOrder =
        response?.data?.data ||
        response?.data?.order ||
        response?.data?.activeOrder ||
        null;

      if (response?.data?.success && activeOrder?._id) {
        navigate(`/pos/order/${getId(table)}?orderId=${activeOrder._id}`);
      } else {
        navigate(`/pos/order/${getId(table)}`);
      }
    } catch {
      navigate(`/pos/order/${getId(table)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#08090f]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#FF5722] border-t-transparent" />
          <p className="text-xs text-slate-500">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#08090f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0b0d16] px-6 py-4">
        <div>
          <h2
            className="flex items-center text-lg font-black tracking-tight text-white"
            style={{ fontFamily: "Outfit,sans-serif" }}
          >
            <Grid3X3 className="mr-2 h-5 w-5 text-[#FF5722]" />
            Floor Plan
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Select a table to start or continue an order
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 text-[10px] font-bold xl:flex">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400">{stats.available} Available</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-slate-400">{stats.occupied} Occupied</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-slate-400">
                {stats.paymentPending} Payment
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-slate-400">{stats.reserved} Reserved</span>
            </div>
          </div>

          <button
            onClick={fetchFloorsAndTables}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            title="Refresh tables"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session Warning */}
      {!session && (
        <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/20">
              <span className="text-[10px] font-black text-amber-400">!</span>
            </div>

            <div>
              <p className="text-xs font-bold text-amber-400">
                No POS Session Open
              </p>
              <p className="text-[10px] text-amber-600">
                You need an active session to process orders
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/pos/open-session")}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-black text-slate-900 transition-all hover:bg-amber-400"
          >
            <span>Open Session</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-xl border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {floors.length === 0 && tables.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1120]">
            <HelpCircle className="h-8 w-8 text-slate-600" />
          </div>

          <h3
            className="mb-1 text-base font-bold text-white"
            style={{ fontFamily: "Outfit,sans-serif" }}
          >
            No Floor Plan Configured
          </h3>

          <p className="max-w-xs text-sm text-slate-500">
            Create floors and add tables from the admin panel to get started.
          </p>

          <button
            onClick={() => navigate("/admin/tables")}
            className="mt-4 rounded-xl bg-[#FF5722] px-5 py-2.5 text-xs font-black text-white transition hover:bg-orange-500"
          >
            Configure Tables →
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Floor Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto px-6 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedFloorTab("all")}
              className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedFloorTab === "all"
                  ? "border border-[#FF5722]/30 bg-gradient-to-r from-[#FF5722]/20 to-[#f97316]/10 text-[#FF5722]"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                <span>All Floors</span>
                <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-slate-300">
                  {tables.length} Tables
                </span>
              </div>
            </button>

            {floors.map((floor) => {
              const floorId = getId(floor);
              const floorTablesCount = tables.filter(
                (table) => getFloorId(table) === floorId
              ).length;

              return (
                <button
                  key={floorId}
                  onClick={() => setSelectedFloorTab(floorId)}
                  className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    selectedFloorTab === floorId
                      ? "border border-[#FF5722]/30 bg-gradient-to-r from-[#FF5722]/20 to-[#f97316]/10 text-[#FF5722]"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{getFloorName(floor)}</span>
                    <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-slate-300">
                      {floorTablesCount}{" "}
                      {floorTablesCount === 1 ? "Table" : "Tables"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Table Grid */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <Grid3X3 className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm font-semibold">No tables on this floor</p>
                <p className="mt-1 text-xs">
                  Add tables from Admin → Tables section
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                {activeTables.map((table) => {
                  const status = normalizeStatus(table.status);
                  const styles = getStatusStyle(status);
                  const tableName = getTableName(table);
                  const seats = getTableSeats(table);
                  const isInactive = status === "inactive";

                  return (
                    <button
                      key={getId(table)}
                      disabled={isInactive}
                      onClick={() => handleTableSelect(table)}
                      className={`group relative flex h-32 flex-col items-center justify-center rounded-3xl border-2 p-4 text-center transition-all duration-200 active:scale-95 ${styles.card}`}
                    >
                      <span
                        className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                      />

                      <div className="text-3xl font-black leading-none">
                        {tableName}
                      </div>

                      <div className="mt-3 flex items-center gap-1 opacity-80">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">
                          {seats || 0} Seats
                        </span>
                      </div>

                      <div
                        className={`mt-3 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${styles.badge}`}
                      >
                        {getStatusLabel(status)}
                      </div>

                      {status === "payment_pending" && (
                        <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-sky-300">
                          <Clock3 className="h-3 w-3" />
                          Collect Payment
                        </div>
                      )}

                      {!isInactive && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100">
                          <ArrowRight className="h-5 w-5 opacity-80" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePopup;