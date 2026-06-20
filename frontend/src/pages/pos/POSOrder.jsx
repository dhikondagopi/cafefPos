import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { usePOS } from "../../context/POSContext";
import {
  Search,
  User,
  Users,
  X,
  Plus,
  Minus,
  ChefHat,
  ShoppingBag,
  Tag,
  Coffee,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Wallet,
  Phone,
  Check,
  Edit2,
} from "lucide-react";

const CURRENCY = "₹";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const extractList = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.tables)) return data.tables;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.paymentMethods)) return data.paymentMethods;

  return [];
};

const getId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
};

const getName = (item, fallback = "") => {
  if (!item) return fallback;

  return (
    item.name ||
    item.productName ||
    item.categoryName ||
    item.tableName ||
    item.tableNumber ||
    item.customerName ||
    item.fullName ||
    item.methodName ||
    fallback
  );
};

const getProductName = (product) => {
  return product?.name || product?.productName || product?.title || "Product";
};

const getProductPrice = (product) => {
  return Number(product?.price || product?.sellingPrice || product?.unitPrice || 0);
};

const getProductStock = (product) => {
  const value =
    product?.stock ??
    product?.quantity ??
    product?.qty ??
    product?.availableQty ??
    product?.inventory ??
    0;

  return Number(value || 0);
};

const getOrderTotal = (order) => {
  return Number(order?.total || order?.totalAmount || order?.grandTotal || 0);
};

const isEditableOrder = (order) => {
  return !order || order.status === "draft";
};

const productImageMap = {
  cappuccino:
    "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop",
  "cold coffee":
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop",
  espresso:
    "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&auto=format&fit=crop",
  "masala tea":
    "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&auto=format&fit=crop",
  "green tea":
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop",
  "french fries":
    "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop",
  "veg sandwich":
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop",
  "veg burger":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop",
  "paneer pizza":
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop",
  "chocolate brownie":
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop",
  brownie:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop",
  "chocolate bronwie":
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop",
  cheesecake:
    "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop",
  "chocolate muffin":
    "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&auto=format&fit=crop",
};

const fallbackSvg = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
    <rect width="400" height="260" fill="#0d1120"/>
    <circle cx="200" cy="115" r="52" fill="#ff5722" opacity="0.22"/>
    <text x="200" y="138" text-anchor="middle" font-size="58">☕</text>
    <text x="200" y="205" text-anchor="middle" fill="#64748b" font-size="22" font-family="Arial">CafeFlow POS</text>
  </svg>
`);

const getProductImage = (product) => {
  const name = getProductName(product).trim().toLowerCase();

  if (productImageMap[name]) {
    return productImageMap[name];
  }

  return (
    product?.imageUrl ||
    product?.image ||
    product?.photo ||
    product?.thumbnail ||
    `data:image/svg+xml;charset=UTF-8,${fallbackSvg}`
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);

  const configs = {
    success: { cls: "toast-success", icon: <CheckCircle className="w-4 h-4" /> },
    error: { cls: "toast-error", icon: <AlertCircle className="w-4 h-4" /> },
    info: { cls: "toast-info", icon: <Clock className="w-4 h-4" /> },
    warning: { cls: "toast-warning", icon: <AlertCircle className="w-4 h-4" /> },
  };

  const cfg = configs[type] || configs.info;

  return (
    <div className={`toast ${cfg.cls}`}>
      {cfg.icon}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto opacity-60 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const POSOrder = () => {
  const { tableId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const { session } = useAuth();
  const navigate = useNavigate();

  const {
    searchTerm,
    activeTable,
    setActiveTable,
    activeOrder,
    setActiveOrder,
  } = usePOS();

  const [table, setTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const [ordersLog, setOrdersLog] = useState([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderFilterStatus, setOrderFilterStatus] = useState("all");

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedCustomerEdit, setSelectedCustomerEdit] = useState(null);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [isCustomerAddOpen, setIsCustomerAddOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = (message, type = "info") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setActiveTable(table);
  }, [table]);

  useEffect(() => {
    setActiveOrder(order);
  }, [order]);

  useEffect(() => {
    fetchInitialData();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("kitchen_status_updated", (updatedOrder) => {
      setOrder((prev) =>
        prev && updatedOrder._id === prev._id ? updatedOrder : prev
      );

      if (isOrdersModalOpen) fetchOrdersLog();
    });

    socket.on("order_updated", (updatedOrder) => {
      setOrder((prev) =>
        prev && updatedOrder._id === prev._id ? updatedOrder : prev
      );
    });

    socket.on("order_paid", (updatedOrder) => {
      setOrder((prev) =>
        prev && updatedOrder._id === prev._id ? updatedOrder : prev
      );
    });

    return () => socket.disconnect();
  }, [tableId, orderIdParam]);

  const fetchInitialData = async () => {
    setLoading(true);

    try {
      const [tableRes, catRes, prodRes, custRes] = await Promise.all([
        API.get("/tables"),
        API.get("/categories"),
        API.get("/products"),
        API.get("/customers"),
      ]);

      const tableList = extractList(tableRes, "tables");
      const categoryList = extractList(catRes, "categories");
      const productList = extractList(prodRes, "products");
      const customerList = extractList(custRes, "customers");

      setTables(tableList);
      setCategories(categoryList);
      setProducts(productList);
      setCustomers(customerList);

      const foundTable = tableList.find((tableItem) => getId(tableItem) === tableId);

      if (foundTable) {
        setTable(foundTable);
        setActiveTable(foundTable);
        localStorage.setItem("cafeflow_current_table", JSON.stringify(foundTable));
        window.dispatchEvent(new Event("cafeflow_table_changed"));
      }

      let payList = [];

      try {
        const payRes = await API.get("/payment-methods/active");
        payList = extractList(payRes, "paymentMethods");
      } catch {
        try {
          const payRes = await API.get("/payment-methods");
          payList = extractList(payRes, "paymentMethods");
        } catch {
          try {
            const payRes = await API.get("/payments/methods");
            payList = extractList(payRes, "paymentMethods");
          } catch {
            payList = [];
          }
        }
      }

      const activePay = payList.filter(
        (method) =>
          method.isActive !== false &&
          method.active !== false &&
          method.enabled !== false
      );

      setPaymentMethods(activePay);

      if (activePay.length > 0) {
        setSelectedPaymentMethod(getId(activePay[0]) || getName(activePay[0], "Cash"));
      } else {
        setSelectedPaymentMethod("Cash");
      }

      if (orderIdParam) {
        const orderRes = await API.get(`/orders/${orderIdParam}`).catch(async () => {
          const allOrdersRes = await API.get("/orders");
          const allOrders = extractList(allOrdersRes, "orders");

          return {
            data: {
              success: true,
              data: allOrders.find((item) => getId(item) === orderIdParam),
            },
          };
        });

        const foundOrder =
          orderRes?.data?.data || orderRes?.data?.order || orderRes?.data || null;

        if (foundOrder?._id) {
          setOrder(foundOrder);
          setSelectedCustomerId(getId(foundOrder.customer));
          setCashReceived(getOrderTotal(foundOrder).toFixed(2));
        }
      } else {
        try {
          const activeOrderRes = await API.get(`/orders/active-table/${tableId}`);

          const activeOrd =
            activeOrderRes?.data?.data ||
            activeOrderRes?.data?.order ||
            activeOrderRes?.data?.activeOrder ||
            null;

          if (activeOrd?._id) {
            setOrder(activeOrd);
            setSelectedCustomerId(getId(activeOrd.customer));
            setCashReceived(getOrderTotal(activeOrd).toFixed(2));
            setSearchParams({ orderId: activeOrd._id });
          } else {
            setOrder(null);
            setSelectedCustomerId("");
            setCashReceived("");
          }
        } catch {
          setOrder(null);
        }
      }
    } catch (err) {
      console.error("POS init error", err);
      showToast("Failed to load POS data. Check backend and MongoDB.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersLog = async () => {
    try {
      const res = await API.get("/orders");
      const list = extractList(res, "orders");
      setOrdersLog(list);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await API.get("/customers");
      setCustomers(extractList(res, "customers"));
    } catch {
      // keep old list
    }
  };

  const syncOrderWithBackend = async (newItems, custId = selectedCustomerId) => {
    try {
      const payload = {
        items: newItems,
        customer: custId || null,
        couponCode: order?.coupon?.code || "",
      };

      if (order) {
        const res = await API.put(`/orders/${order._id}`, payload);

        const updatedOrder = res?.data?.data || res?.data?.order || null;

        if (updatedOrder) {
          setOrder(updatedOrder);
          setCashReceived(getOrderTotal(updatedOrder).toFixed(2));
        }
      } else {
        if (!session?._id) {
          showToast("Open a POS session before creating orders.", "warning");
          navigate("/pos/open-session");
          return;
        }

        const createPayload = {
          session: session._id,
          table: tableId,
          ...payload,
        };

        const res = await API.post("/orders", createPayload);

        const createdOrder = res?.data?.data || res?.data?.order || null;

        if (createdOrder?._id) {
          setOrder(createdOrder);
          setCashReceived(getOrderTotal(createdOrder).toFixed(2));
          setSearchParams({ orderId: createdOrder._id });
        }
      }
    } catch (err) {
      console.error("Sync order error", err);
      showToast(err.response?.data?.message || "Failed to update order.", "error");
    }
  };

  const handleAddItem = (product) => {
    if (!session?._id) {
      showToast("Open a POS session before creating orders.", "warning");
      navigate("/pos/open-session");
      return;
    }

    if (!isEditableOrder(order)) {
      showToast(
        "This order is already sent to kitchen. Start a new order to add items.",
        "warning"
      );
      return;
    }

    const productId = getId(product);
    let updatedItems = [];

    if (order) {
      const existingIdx = order.items.findIndex(
        (item) => getId(item.product) === productId
      );

      if (existingIdx > -1) {
        updatedItems = order.items.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: Number(item.quantity || 1) + 1 }
            : item
        );
      } else {
        updatedItems = [
          ...order.items,
          {
            product: productId,
            name: getProductName(product),
            price: getProductPrice(product),
            quantity: 1,
            notes: "",
          },
        ];
      }
    } else {
      updatedItems = [
        {
          product: productId,
          name: getProductName(product),
          price: getProductPrice(product),
          quantity: 1,
          notes: "",
        },
      ];
    }

    const formatted = updatedItems.map((item) => ({
      product: getId(item.product),
      quantity: Number(item.quantity || 1),
      notes: item.notes || "",
    }));

    syncOrderWithBackend(formatted);
  };

  const handleUpdateQty = (productId, change) => {
    if (!order || order.status !== "draft") return;

    const updatedItems = order.items
      .map((item) => {
        const matchId = getId(item.product);

        if (matchId === productId) {
          const newQty = Number(item.quantity || 1) + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }

        return item;
      })
      .filter(Boolean);

    syncOrderWithBackend(
      updatedItems.map((item) => ({
        product: getId(item.product),
        quantity: Number(item.quantity || 1),
        notes: item.notes || "",
      }))
    );
  };

  const handleSendToKitchen = async () => {
    if (!order || order.items.length === 0) return;

    setActionLoading(true);

    try {
      let res = null;

      try {
        res = await API.post(`/orders/${order._id}/send-to-kitchen`);
      } catch {
        res = await API.patch(`/orders/${order._id}/send-to-kitchen`);
      }

      const updatedOrder = res?.data?.data || res?.data?.order || null;

      if (updatedOrder) {
        setOrder(updatedOrder);
        showToast("Order sent to kitchen!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send to kitchen.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!order || !couponCode.trim()) return;

    setCouponLoading(true);

    try {
      const formatted = order.items.map((item) => ({
        product: getId(item.product),
        quantity: Number(item.quantity || 1),
        notes: item.notes || "",
      }));

      const res = await API.put(`/orders/${order._id}`, {
        items: formatted,
        customer: selectedCustomerId || null,
        couponCode: couponCode.trim(),
      });

      const updatedOrder = res?.data?.data || res?.data?.order || null;

      if (updatedOrder) {
        setOrder(updatedOrder);
        setCashReceived(getOrderTotal(updatedOrder).toFixed(2));
        showToast("Coupon applied successfully!", "success");
        setIsCouponModalOpen(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid coupon code.", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayOrder = async () => {
    if (!order) return;

    const kitchenStatus = order.kitchenStatus || order.kitchen_status;

    if (!(order.status === "sent_to_kitchen" && kitchenStatus === "completed")) {
      showToast("Kitchen must complete the order before payment.", "warning");
      return;
    }

    const methodObj =
      paymentMethods.find(
        (method) =>
          getId(method) === selectedPaymentMethod ||
          getName(method).toLowerCase() ===
            String(selectedPaymentMethod).toLowerCase()
      ) || paymentMethods[0];

    const methodId = getId(methodObj) || selectedPaymentMethod;
    const total = getOrderTotal(order);
    const received = Number(cashReceived || total);

    if (!methodId) {
      showToast("Payment method not configured.", "error");
      return;
    }

    if (
      String(getName(methodObj, selectedPaymentMethod))
        .toLowerCase()
        .includes("cash") &&
      received < total
    ) {
      showToast("Cash received is less than order total.", "warning");
      return;
    }

    setActionLoading(true);

    const payload = {
      paymentMethodId: methodId,
      paymentMethod: methodId,
      method: getName(methodObj, selectedPaymentMethod),
      cashReceived: received,
      receivedAmount: received,
      amount: total,
      totalAmount: total,
      status: "paid",
      markOrderPaid: true,
    };

    try {
      let response = null;

      try {
        response = await API.post(`/orders/${order._id}/pay`, payload);
      } catch {
        try {
          response = await API.post(`/orders/${order._id}/payment`, payload);
        } catch {
          response = await API.post("/payments", {
            ...payload,
            order: order._id,
            orderId: order._id,
          });
        }
      }

      const changeDue =
        response?.data?.changeDue ||
        response?.data?.change ||
        Math.max(received - total, 0);

      showToast("Payment completed successfully.", "success");

      navigate(`/pos/receipt/${order._id}?changeDue=${changeDue}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Payment failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      const res = await API.delete(`/orders/${id}`);

      if (res.data.success) {
        setSelectedOrderDetails(null);
        fetchOrdersLog();

        if (order?._id === id) {
          setOrder(null);
          setSearchParams({});
        }

        showToast("Order deleted.", "info");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const handleEditOrder = (ord) => {
    setIsOrdersModalOpen(false);
    setSelectedOrderDetails(null);
    navigate(`/pos/order/${getId(ord.table)}?orderId=${ord._id}`);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    if (!custName || !custPhone) {
      return showToast("Name and phone are required.", "warning");
    }

    try {
      if (selectedCustomerEdit) {
        const res = await API.put(`/customers/${selectedCustomerEdit._id}`, {
          name: custName,
          email: custEmail,
          phone: custPhone,
        });

        if (res.data.success) {
          setSelectedCustomerEdit(null);
          fetchCustomersList();
          showToast("Customer updated.", "success");
        }
      } else {
        const res = await API.post("/customers", {
          name: custName,
          email: custEmail,
          phone: custPhone,
        });

        const createdCustomer = res?.data?.data || res?.data?.customer || null;

        if (createdCustomer?._id) {
          setIsCustomerAddOpen(false);
          fetchCustomersList();
          setSelectedCustomerId(createdCustomer._id);

          if (order) {
            const formatted = order.items.map((item) => ({
              product: getId(item.product),
              quantity: Number(item.quantity || 1),
              notes: item.notes || "",
            }));

            syncOrderWithBackend(formatted, createdCustomer._id);
          }

          showToast("Customer registered!", "success");
        }
      }

      setCustName("");
      setCustEmail("");
      setCustPhone("");
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed.", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      const res = await API.delete(`/customers/${id}`);

      if (res.data.success) {
        setSelectedCustomerEdit(null);
        fetchCustomersList();

        if (selectedCustomerId === id) setSelectedCustomerId("");

        showToast("Customer deleted.", "info");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const filteredProducts = products.filter((prod) => {
    const productName = getProductName(prod).toLowerCase();
    const productCategoryId = getId(prod.category);
    const productCategoryName = String(prod.categoryName || "").toLowerCase();
    const categorySearch = String(selectedCategory || "").toLowerCase();

    const matchesSearch = productName.includes(String(searchTerm || "").toLowerCase());

    const matchesCat =
      selectedCategory === "all" ||
      productCategoryId === selectedCategory ||
      productCategoryName === categorySearch;

    const isActive =
      prod.isActive !== false &&
      prod.active !== false &&
      prod.enabled !== false &&
      prod.status !== "inactive";

    const isAvailable =
      prod.isAvailable !== false &&
      prod.available !== false &&
      prod.availability !== false;

    const showInPOS =
      prod.showInPOS !== false &&
      prod.visibleInPOS !== false &&
      prod.posVisible !== false;

    return matchesSearch && matchesCat && isActive && isAvailable && showInPOS;
  });

  const filteredOrdersLog = ordersLog.filter((o) => {
    const term = orderSearchTerm.toLowerCase();
    const orderNumber = String(o.orderNumber || "").toLowerCase();
    const customerName = String(o.customer?.name || "walk-in").toLowerCase();
    const createdDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "";

    const matchTerm =
      orderNumber.includes(term) ||
      customerName.includes(term) ||
      createdDate.includes(term);

    const matchStatus = orderFilterStatus === "all" || o.status === orderFilterStatus;

    return matchTerm && matchStatus;
  });

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearchTerm.toLowerCase();

    return (
      String(c.name || "").toLowerCase().includes(term) ||
      String(c.phone || "").includes(term) ||
      String(c.email || "").toLowerCase().includes(term)
    );
  });

  const gridSlots = Array.from({ length: 16 }, (_, i) => i + 1);

  const getTableForIndex = (num) => {
    const match = tables.find((t) => {
      const tableName = String(t.name || t.tableName || t.tableNumber || "");
      return tableName === `Table ${num}` || tableName === `${num}` || tableName.endsWith(` ${num}`);
    });

    if (match) return match;

    return tables.length > 0 ? tables[(num - 1) % tables.length] : null;
  };

  const handleSwitchTable = async (tableNum) => {
    const targetTable = getTableForIndex(tableNum);

    if (!targetTable) return;

    setIsTableModalOpen(false);
    navigate(`/pos/order/${targetTable._id}`);
  };

  const selectedCustomer = customers.find((c) => c._id === selectedCustomerId);

  const orderKitchenStatus = order?.kitchenStatus || order?.kitchen_status;
  const canPay =
    order &&
    order.status === "sent_to_kitchen" &&
    orderKitchenStatus === "completed";

  const selectedPaymentMethodObj =
    paymentMethods.find(
      (method) =>
        getId(method) === selectedPaymentMethod ||
        getName(method).toLowerCase() ===
          String(selectedPaymentMethod).toLowerCase()
    ) || null;

  const selectedPaymentMethodName = getName(
    selectedPaymentMethodObj,
    selectedPaymentMethod || "Cash"
  );

  const selectedPaymentKey = selectedPaymentMethodName.toLowerCase();
  const isCashPayment = selectedPaymentKey.includes("cash");

  const getPaymentIcon = (methodName) => {
    const key = String(methodName || "").toLowerCase();

    if (key.includes("cash")) return <Wallet className="w-4 h-4" />;
    if (key.includes("upi")) return <Phone className="w-4 h-4" />;
    if (key.includes("card")) return <CreditCard className="w-4 h-4" />;

    return <CreditCard className="w-4 h-4" />;
  };

  const statusBadge = (status) => {
    const map = {
      draft: "status-draft",
      sent_to_kitchen: "status-sent",
      paid: "status-paid",
      cancelled: "status-cancelled",
    };

    const labels = {
      draft: "Draft",
      sent_to_kitchen: "In Kitchen",
      paid: "Paid",
      cancelled: "Cancelled",
    };

    return (
      <span className={`status-badge ${map[status] || "status-draft"}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#08090f]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-medium">
            Loading POS Terminal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#08090f] text-slate-200 overflow-hidden relative w-full">
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* Main POS Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category Sidebar */}
        <aside className="w-[90px] bg-[#0b0d16] border-r border-white/5 flex flex-col items-center py-3 gap-1.5 overflow-y-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-[72px] py-3 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all border ${
              selectedCategory === "all"
                ? "bg-gradient-to-b from-[#FF5722]/20 to-[#f97316]/10 border-[#FF5722]/30 text-[#FF5722]"
                : "border-white/5 bg-white/2 text-slate-500 hover:text-white hover:border-white/10"
            }`}
          >
            <Coffee
              className={`w-4 h-4 mx-auto mb-1 ${
                selectedCategory === "all" ? "text-[#FF5722]" : "text-slate-600"
              }`}
            />
            All
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            const buttonColor = cat.color || "#FF5722";

            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className="w-[72px] py-3 rounded-xl text-[9px] font-black uppercase tracking-wider text-center leading-tight transition-all border border-white/5 bg-white/2 text-slate-500 hover:text-white hover:border-white/10"
                style={
                  isSelected
                    ? {
                        borderColor: `${buttonColor}50`,
                        background: `linear-gradient(to bottom, ${buttonColor}25, ${buttonColor}05)`,
                        color: buttonColor,
                      }
                    : {}
                }
              >
                {cat.name || cat.categoryName}
              </button>
            );
          })}
        </aside>

        {/* Product Grid */}
        <main className="flex-grow flex flex-col bg-[#08090f] overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 content-start scrollbar-none">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                <Coffee className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-xs font-semibold">No products in this category</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const productId = getId(prod);
                const productName = getProductName(prod);
                const productPrice = getProductPrice(prod);
                const productStock = getProductStock(prod);

                const inCart = order?.items.find(
                  (item) => getId(item.product) === productId
                );

                return (
                  <button
                    key={productId}
                    onClick={() => handleAddItem(prod)}
                    disabled={
                      order && (order.status === "paid" || order.status === "cancelled")
                    }
                    className={`relative bg-[#0d1120] border rounded-2xl p-3 flex flex-col text-left group transition-all duration-200 disabled:opacity-40 active:scale-95 ${
                      inCart
                        ? "border-[#FF5722]/30 shadow-[0_0_15px_rgba(255,87,34,0.1)]"
                        : "border-white/6 hover:border-white/14"
                    }`}
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF5722] rounded-full flex items-center justify-center text-[9px] font-black text-white z-10">
                        {inCart.quantity}
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full block ${
                          prod.isAvailable !== false ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                    </div>

                    <img
                      src={getProductImage(prod)}
                      alt={productName}
                      className="w-full h-24 object-cover rounded-xl mb-2.5 bg-[#131828] transition-transform duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml;charset=UTF-8,${fallbackSvg}`;
                      }}
                    />

                    <h4 className="font-bold text-white text-xs leading-snug truncate group-hover:text-[#FF5722] transition-colors">
                      {productName}
                    </h4>

                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[#FF5722] font-mono font-bold text-xs">
                        {CURRENCY}
                        {productPrice.toFixed(2)}
                      </span>

                      <span className="text-[9px] text-slate-600">
                        Stk: {productStock}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </main>

        {/* Cart */}
        <section className="w-[320px] bg-[#0b0d16] border-l border-white/5 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-[#FF5722]" />
              <span
                className="text-xs font-black text-white"
                style={{ fontFamily: "Outfit,sans-serif" }}
              >
                Order {order ? `#${String(order.orderNumber || "").slice(-4)}` : ""}
              </span>
            </div>

            {order && (
              <div className="flex items-center space-x-1">
                {statusBadge(order.status)}

                {order.status === "sent_to_kitchen" && (
                  <span
                    className={`status-badge text-[8px] px-1.5 py-0.5 ${
                      orderKitchenStatus === "completed"
                        ? "status-completed"
                        : orderKitchenStatus === "preparing"
                        ? "status-preparing"
                        : "status-pending"
                    }`}
                  >
                    KDS: {orderKitchenStatus === "to_cook" ? "To Cook" : orderKitchenStatus}
                  </span>
                )}
              </div>
            )}

            {selectedCustomer && (
              <div className="flex items-center space-x-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <User className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-bold text-indigo-400 truncate max-w-[80px]">
                  {selectedCustomer.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none">
            {!order || order.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12 space-y-2">
                <ShoppingBag className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold">Cart is empty</p>
                <p className="text-[10px] text-slate-700">Click products to add items</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {order.items.map((item) => {
                  const pId = getId(item.product);
                  const itemPrice = Number(item.price || item.unitPrice || 0);
                  const itemQty = Number(item.quantity || 1);

                  return (
                    <div
                      key={item._id || pId}
                      className="bg-[#0d1120] border border-white/5 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">
                            {item.name || getName(item.product, "Product")}
                          </h5>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {CURRENCY}
                            {itemPrice.toFixed(2)} each
                          </span>
                        </div>

                        <span className="font-mono font-bold text-xs text-[#FF5722] ml-2 flex-shrink-0">
                          {CURRENCY}
                          {(itemPrice * itemQty).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        {order.status === "draft" ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQty(pId, -1)}
                              className="w-6 h-6 bg-[#131828] hover:bg-red-950/30 border border-white/8 hover:border-red-500/30 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>

                            <span className="text-xs font-mono font-black text-white w-5 text-center">
                              {itemQty}
                            </span>

                            <button
                              onClick={() => handleUpdateQty(pId, 1)}
                              className="w-6 h-6 bg-[#131828] hover:bg-emerald-950/30 border border-white/8 hover:border-emerald-500/30 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            Qty: {itemQty}
                          </span>
                        )}

                        {order.status === "draft" ? (
                          <input
                            type="text"
                            placeholder="Add note..."
                            value={item.notes || ""}
                            onChange={(e) => {
                              const updatedItems = order.items.map((it) =>
                                getId(it.product) === pId
                                  ? { ...it, notes: e.target.value }
                                  : it
                              );

                              setOrder({ ...order, items: updatedItems });
                            }}
                            onBlur={() => {
                              const formatted = order.items.map((it) => ({
                                product: getId(it.product),
                                quantity: Number(it.quantity || 1),
                                notes: it.notes || "",
                              }));

                              syncOrderWithBackend(formatted);
                            }}
                            className="ml-2 flex-1 min-w-0 px-2 py-1 text-[10px] bg-[#0a0e1a] border border-white/6 rounded-lg focus:border-indigo-500/40 text-white focus:outline-none placeholder-slate-700"
                          />
                        ) : (
                          item.notes && (
                            <span className="text-[9px] italic text-slate-500 ml-2">
                              "{item.notes}"
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {order && order.items.length > 0 && (
            <div className="border-t border-white/5 flex-shrink-0">
              <div className="grid grid-cols-3 border-b border-white/5">
                <button
                  onClick={() => {
                    fetchCustomersList();
                    setIsCustomersModalOpen(true);
                  }}
                  className="py-2.5 text-[9px] font-bold uppercase tracking-wider border-r border-white/5 text-slate-400 hover:text-white hover:bg-white/3 transition-colors flex flex-col items-center gap-0.5"
                >
                  <User className="w-3.5 h-3.5" />
                  Customer
                </button>

                <button
                  onClick={() => setIsCouponModalOpen(true)}
                  className={`py-2.5 text-[9px] font-bold uppercase tracking-wider border-r border-white/5 transition-colors flex flex-col items-center gap-0.5 ${
                    order?.coupon
                      ? "text-emerald-400 hover:text-emerald-300"
                      : "text-slate-400 hover:text-white hover:bg-white/3"
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {order?.coupon ? `${order.coupon.discount}% off` : "Coupon"}
                </button>

                <button
                  onClick={handleSendToKitchen}
                  disabled={!order || order.status !== "draft" || actionLoading}
                  className="py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 disabled:opacity-30 transition-colors flex flex-col items-center gap-0.5"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>

              <div className="px-4 py-3 space-y-1.5 bg-[#0b0d16]">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-300">
                    {CURRENCY}
                    {Number(order?.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax (5% GST)</span>
                  <span className="font-mono text-slate-300">
                    {CURRENCY}
                    {Number(order?.tax || 0).toFixed(2)}
                  </span>
                </div>

                {Number(order?.discount || 0) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      Discount
                    </span>
                    <span className="font-mono">
                      -{CURRENCY}
                      {Number(order.discount || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 border-t border-white/5">
                  <span className="text-sm font-black text-white">Total</span>
                  <span className="text-sm font-black text-[#FF5722] font-mono">
                    {CURRENCY}
                    {getOrderTotal(order).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Payment Panel */}
        <section className="w-[240px] bg-[#0b0d16] border-l border-white/5 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Payment Method
            </p>

            <div className="space-y-1.5">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => {
                  const methodName = getName(method, "Payment");
                  const isSelected =
                    selectedPaymentMethod === getId(method) ||
                    String(selectedPaymentMethod).toLowerCase() ===
                      methodName.toLowerCase();

                  return (
                    <button
                      key={getId(method)}
                      onClick={() => setSelectedPaymentMethod(getId(method) || methodName)}
                      className={`w-full py-2 px-3 border rounded-xl flex items-center space-x-2.5 text-xs font-bold transition-all ${
                        isSelected
                          ? "border-[#FF5722]/40 bg-[#FF5722]/10 text-white"
                          : "border-white/6 bg-white/2 text-slate-400 hover:text-white hover:border-white/12"
                      }`}
                    >
                      {getPaymentIcon(methodName)}
                      <span>{methodName}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 ml-auto text-[#FF5722]" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="space-y-1.5">
                  {["Cash", "UPI", "Card"].map((methodName) => (
                    <button
                      key={methodName}
                      onClick={() => setSelectedPaymentMethod(methodName)}
                      className={`w-full py-2 px-3 border rounded-xl flex items-center space-x-2.5 text-xs font-bold transition-all ${
                        selectedPaymentMethod === methodName
                          ? "border-[#FF5722]/40 bg-[#FF5722]/10 text-white"
                          : "border-white/6 bg-white/2 text-slate-400 hover:text-white"
                      }`}
                    >
                      {getPaymentIcon(methodName)}
                      <span>{methodName}</span>
                      {selectedPaymentMethod === methodName && (
                        <Check className="w-3.5 h-3.5 ml-auto text-[#FF5722]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#08090f] border-b border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">
              Amount
            </p>

            <div
              className="text-2xl font-black text-white"
              style={{ fontFamily: "JetBrains Mono,monospace" }}
            >
              {CURRENCY}
              {order ? getOrderTotal(order).toFixed(2) : "0.00"}
            </div>

            {isCashPayment && cashReceived && (
              <div className="mt-1 text-[10px] text-slate-500 font-mono">
                Rcvd: {CURRENCY}
                {cashReceived} | Change: {CURRENCY}
                {Math.max(
                  0,
                  Number(cashReceived || 0) - getOrderTotal(order)
                ).toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex-1 p-2.5 bg-[#0b0d16]">
            <div className="grid grid-cols-3 gap-1.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === "⌫") {
                        setCashReceived((prev) => prev.slice(0, -1));
                      } else {
                        setCashReceived((prev) => prev + key);
                      }
                    }}
                    className={`py-3 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                      key === "⌫"
                        ? "bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/40"
                        : "bg-[#0d1120] border-white/5 text-white hover:bg-[#131828] hover:border-white/10"
                    }`}
                  >
                    {key}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setCashReceived("")}
              className="w-full mt-1.5 py-2 bg-[#0d1120] border border-white/5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white hover:border-white/10 transition-all"
            >
              Clear
            </button>
          </div>

          <div className="p-3 space-y-2 border-t border-white/5">
            {order?.status === "draft" && (
              <button
                onClick={handleSendToKitchen}
                disabled={actionLoading || !order || order.items.length === 0}
                className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 text-amber-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
              >
                <ChefHat className="w-4 h-4" />
                <span>Send to Kitchen</span>
              </button>
            )}

            <button
              onClick={handlePayOrder}
              disabled={actionLoading || !canPay}
              title={!canPay ? "Kitchen must complete order first" : "Process payment"}
              className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center space-x-2 ${
                canPay
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-white/4 border border-white/6 text-slate-600 cursor-not-allowed"
              }`}
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>
                    Pay {CURRENCY}
                    {getOrderTotal(order).toFixed(2)}
                  </span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Table Selector Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <span
                className="font-black text-sm text-white"
                style={{ fontFamily: "Outfit,sans-serif" }}
              >
                Switch Table
              </span>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 text-slate-500 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-4 gap-2.5">
                {gridSlots.map((num) => {
                  const tbl = getTableForIndex(num);
                  const isCurrent = tbl?._id === tableId;
                  const status = tbl?.status || "offline";

                  let cls = "border-white/8 text-slate-600 hover:border-white/15";

                  if (tbl) {
                    if (isCurrent) {
                      cls =
                        "border-[#FF5722]/50 bg-[#FF5722]/15 text-white ring-1 ring-[#FF5722]/30";
                    } else if (status === "occupied") {
                      cls = "table-card-occupied";
                    } else if (status === "reserved") {
                      cls = "table-card-reserved";
                    } else {
                      cls = "table-card-available";
                    }
                  }

                  return (
                    <button
                      key={num}
                      onClick={() => handleSwitchTable(num)}
                      className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center font-black text-base transition-all ${cls}`}
                    >
                      {num}
                      {tbl && (
                        <span className="text-[8px] opacity-60 mt-0.5">
                          {tbl.capacity || tbl.seats || 0}p
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Occupied
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Reserved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Log Modal */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-14 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-6">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-[#FF5722]" />
                <span
                  className="font-black text-base text-white"
                  style={{ fontFamily: "Outfit,sans-serif" }}
                >
                  Orders History
                </span>
              </div>

              <button
                onClick={() => {
                  setIsOrdersModalOpen(false);
                  setSelectedOrderDetails(null);
                }}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="w-3/5 flex flex-col border-r border-white/5">
                <div className="p-4 border-b border-white/5 space-y-2">
                  <div className="relative flex items-center bg-[#0b0d16] border border-white/6 rounded-xl px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {["all", "draft", "sent_to_kitchen", "paid", "cancelled"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => setOrderFilterStatus(status)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                            orderFilterStatus === status
                              ? "bg-[#FF5722]/20 text-[#FF5722] border border-[#FF5722]/30"
                              : "bg-white/3 text-slate-500 border border-white/5 hover:text-white"
                          }`}
                        >
                          {status === "sent_to_kitchen" ? "Kitchen" : status}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none">
                  {filteredOrdersLog.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs py-12">
                      No orders found.
                    </p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-[#0b0d16] border-b border-white/5">
                        <tr className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-white/4">
                        {filteredOrdersLog.map((o) => (
                          <tr
                            key={o._id}
                            onClick={() => setSelectedOrderDetails(o)}
                            className={`cursor-pointer transition-colors hover:bg-white/3 ${
                              selectedOrderDetails?._id === o._id
                                ? "bg-[#FF5722]/5"
                                : ""
                            }`}
                          >
                            <td className="px-4 py-3 text-slate-500 text-[10px] font-mono">
                              {o.createdAt
                                ? new Date(o.createdAt).toLocaleDateString()
                                : "—"}
                              <br />
                              {o.createdAt
                                ? new Date(o.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </td>

                            <td className="px-4 py-3 font-mono font-black text-slate-200 text-[10px]">
                              #{String(o.orderNumber || "").slice(-5)}
                            </td>

                            <td className="px-4 py-3 text-slate-300 truncate max-w-[90px]">
                              {o.customer?.name || "Walk-in"}
                            </td>

                            <td className="px-4 py-3 font-mono font-bold text-[#FF5722]">
                              {CURRENCY}
                              {getOrderTotal(o).toFixed(2)}
                            </td>

                            <td className="px-4 py-3">{statusBadge(o.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="w-2/5 flex flex-col bg-[#0b0d16] overflow-y-auto scrollbar-none">
                {selectedOrderDetails ? (
                  <div className="p-5 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4
                          className="text-sm font-black text-white"
                          style={{ fontFamily: "Outfit,sans-serif" }}
                        >
                          Order #{selectedOrderDetails.orderNumber}
                        </h4>
                        <p className="text-slate-500 text-[10px] font-mono mt-0.5">
                          {selectedOrderDetails.createdAt
                            ? new Date(selectedOrderDetails.createdAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>

                      {statusBadge(selectedOrderDetails.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        {
                          label: "Customer",
                          value: selectedOrderDetails.customer?.name || "Walk-in",
                        },
                        {
                          label: "Table",
                          value:
                            selectedOrderDetails.table?.name ||
                            selectedOrderDetails.table?.tableNumber ||
                            "—",
                        },
                        {
                          label: "Payment",
                          value: selectedOrderDetails.paymentMethod?.name || "—",
                        },
                        {
                          label: "KDS Status",
                          value: selectedOrderDetails.kitchenStatus || "—",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="bg-[#0d1120] border border-white/5 rounded-xl p-3"
                        >
                          <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-xs text-white font-semibold mt-0.5 truncate">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex-1">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">
                        Order Items
                      </p>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
                        {selectedOrderDetails.items.map((it, idx) => {
                          const itemPrice = Number(it.price || 0);
                          const itemQty = Number(it.quantity || 1);

                          return (
                            <div
                              key={idx}
                              className="flex justify-between text-xs py-1.5 border-b border-white/4"
                            >
                              <span className="text-slate-300">
                                {itemQty}× {it.name}
                              </span>
                              <span className="font-mono text-slate-400">
                                {CURRENCY}
                                {(itemPrice * itemQty).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-sm font-black text-white">Total</span>
                        <span className="text-sm font-black font-mono text-[#FF5722]">
                          {CURRENCY}
                          {getOrderTotal(selectedOrderDetails).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {selectedOrderDetails.status === "draft" ? (
                        <>
                          <button
                            onClick={() => handleDeleteOrder(selectedOrderDetails._id)}
                            className="flex-1 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl transition-all"
                          >
                            Delete
                          </button>

                          <button
                            onClick={() => handleEditOrder(selectedOrderDetails)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#f97316] text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Edit Order
                          </button>
                        </>
                      ) : selectedOrderDetails.status === "paid" ? (
                        <button
                          onClick={() =>
                            navigate(`/pos/receipt/${selectedOrderDetails._id}`)
                          }
                          className="w-full py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-xl"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <div className="w-full text-center text-[10px] text-slate-600 py-2.5 bg-white/3 border border-white/5 rounded-xl">
                          Cannot edit closed transaction
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center p-8">
                    <ShoppingBag className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-xs font-semibold">
                      Select an order to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Modal */}
      {isCustomersModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-lg h-[70vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#FF5722]" />
                <span
                  className="font-black text-sm text-white"
                  style={{ fontFamily: "Outfit,sans-serif" }}
                >
                  Customer Registry
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedCustomerEdit(null);
                    setCustName("");
                    setCustEmail("");
                    setCustPhone("");
                    setIsCustomerAddOpen(true);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#FF5722]/15 hover:bg-[#FF5722]/25 border border-[#FF5722]/25 text-[#FF5722] text-[10px] font-bold rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>

                <button
                  onClick={() => {
                    setIsCustomersModalOpen(false);
                    setIsCustomerAddOpen(false);
                    setSelectedCustomerEdit(null);
                  }}
                  className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-white/5">
              <div className="relative flex items-center bg-[#0b0d16] border border-white/6 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-500 mr-2" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/4">
              {filteredCustomers.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-12">
                  No customers found.
                </p>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c._id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-white/2 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {c.phone} {c.email ? `• ${c.email}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedCustomerId(c._id);

                          if (order) {
                            const formatted = order.items.map((item) => ({
                              product: getId(item.product),
                              quantity: Number(item.quantity || 1),
                              notes: item.notes || "",
                            }));

                            syncOrderWithBackend(formatted, c._id);
                          }

                          setIsCustomersModalOpen(false);
                          showToast(`Customer "${c.name}" linked to order.`, "success");
                        }}
                        className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg transition-all ${
                          selectedCustomerId === c._id
                            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                            : "bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/25"
                        }`}
                      >
                        {selectedCustomerId === c._id ? "✓ Linked" : "Select"}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedCustomerEdit(c);
                          setCustName(c.name);
                          setCustEmail(c.email || "");
                          setCustPhone(c.phone);
                          setIsCustomerAddOpen(true);
                        }}
                        className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white rounded-lg transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Add/Edit Modal */}
      {isCustomerAddOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <span
                className="font-black text-sm text-white"
                style={{ fontFamily: "Outfit,sans-serif" }}
              >
                {selectedCustomerEdit ? "Edit Customer" : "Register Customer"}
              </span>

              <button
                onClick={() => {
                  setIsCustomerAddOpen(false);
                  setSelectedCustomerEdit(null);
                }}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4">
              {[
                {
                  label: "Full Name",
                  value: custName,
                  onChange: setCustName,
                  placeholder: "John Smith",
                  required: true,
                },
                {
                  label: "Email",
                  value: custEmail,
                  onChange: setCustEmail,
                  placeholder: "john@email.com",
                  type: "email",
                },
                {
                  label: "Phone",
                  value: custPhone,
                  onChange: setCustPhone,
                  placeholder: "+91 9876543210",
                  required: true,
                },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {f.label}
                  </label>

                  <input
                    type={f.type || "text"}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="input-dark"
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                </div>
              ))}

              <div className="flex space-x-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerAddOpen(false);
                    setSelectedCustomerEdit(null);
                  }}
                  className="flex-1 btn-ghost py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 btn-primary py-2.5 text-xs font-bold"
                >
                  {selectedCustomerEdit ? "Update" : "Register"}
                </button>
              </div>

              {selectedCustomerEdit && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(selectedCustomerEdit._id)}
                  className="w-full py-2 text-[10px] font-bold text-red-400 hover:bg-red-950/20 rounded-xl transition-all border border-red-900/20 hover:border-red-900/40"
                >
                  Delete Customer Profile
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1120] border border-white/8 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-12 bg-[#0b0d16] border-b border-white/5 flex items-center justify-between px-5">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span
                  className="font-black text-sm text-white"
                  style={{ fontFamily: "Outfit,sans-serif" }}
                >
                  Apply Coupon
                </span>
              </div>

              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {order?.coupon && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />

                  <div>
                    <p className="text-xs font-bold text-emerald-400">
                      Coupon Applied
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      {order.coupon.code} — {order.coupon.discount}% discount
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Coupon Code
                </label>

                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="input-dark"
                  placeholder="e.g. WELCOME10"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 btn-ghost py-2.5 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {couponLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSOrder;