const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Order = require("../models/Order");
const Table = require("../models/Table");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const POSSession = require("../models/POSSession");
const Payment = require("../models/Payment");
const { protect } = require("../middleware/authMiddleware");

const ORDER_STATUSES = ["draft", "sent_to_kitchen", "paid", "cancelled"];
const KITCHEN_STATUSES = ["pending", "to_cook", "preparing", "completed"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const getSocketTableId = (table) => {
  if (!table) return null;
  if (typeof table === "string") return table;
  if (table._id) return String(table._id);
  return String(table);
};

const populateOrder = async (orderId) => {
  return Order.findById(orderId)
    .populate("table", "name tableName tableNumber capacity seats status floor")
    .populate("session", "user status openingBalance closingBalance")
    .populate("customer", "name phone email loyaltyPoints")
    .populate("coupon", "code discountType discountValue")
    .populate("paymentMethod", "name type methodName")
    .populate({
      path: "items.product",
      populate: {
        path: "category",
        select: "name categoryName color",
      },
    });
};

const calculateCouponDiscount = async (couponId, subtotal) => {
  if (!couponId) return 0;

  const coupon = await Coupon.findById(couponId);

  if (!coupon) return 0;

  if (coupon.discountType === "percentage") {
    return subtotal * (Number(coupon.discountValue || 0) / 100);
  }

  return Math.min(Number(coupon.discountValue || 0), subtotal);
};

const resolveCoupon = async (couponCode) => {
  if (couponCode === undefined) return undefined;
  if (!couponCode) return null;

  const coupon = await Coupon.findOne({
    code: String(couponCode).trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) return null;

  if (coupon.expirationDate && new Date(coupon.expirationDate) <= new Date()) {
    return null;
  }

  return coupon;
};

const buildOrderItemsAndTotals = async (items = []) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const productId = item.product || item.productId;

    if (!productId) {
      throw new Error("Product id is required for every order item");
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const quantity = Number(item.quantity || item.qty || 1);
    const price = Number(product.price || product.sellingPrice || product.unitPrice || 0);
    const itemSubtotal = price * quantity;

    subtotal += itemSubtotal;

    orderItems.push({
      product: product._id,
      name: product.name || product.productName || "Product",
      price,
      quantity,
      notes: item.notes || "",
      isCompleted: item.isCompleted || false,
    });
  }

  return { orderItems, subtotal };
};

const recalculateOrderTotals = async (order, items, couponCode) => {
  let subtotal = order.subtotal || 0;

  if (items) {
    const result = await buildOrderItemsAndTotals(items);
    order.items = result.orderItems;
    subtotal = result.subtotal;
    order.subtotal = subtotal;
  }

  let appliedCoupon = order.coupon || undefined;

  if (couponCode !== undefined) {
    if (!couponCode) {
      appliedCoupon = undefined;
    } else {
      const coupon = await resolveCoupon(couponCode);
      appliedCoupon = coupon ? coupon._id : undefined;
    }
  }

  const discount = await calculateCouponDiscount(appliedCoupon, subtotal);
  const taxRate = 0.05;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  order.coupon = appliedCoupon;
  order.discount = discount;
  order.tax = tax;
  order.total = total;

  return order;
};

const emitOrderUpdated = (req, order, eventName = "order_updated") => {
  if (!req.io || !order) return;

  req.io.emit(eventName, order);
  req.io.emit("order_updated", order);
};

const emitTableStatus = (req, tableId, status) => {
  if (!req.io || !tableId) return;

  req.io.emit("table_status_updated", {
    tableId: String(tableId),
    status,
  });
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { status, session, table } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (session) filter.session = session;
    if (table) filter.table = table;

    const orders = await Order.find(filter)
      .populate("table", "name tableName tableNumber capacity seats status floor")
      .populate("session", "user status openingBalance closingBalance")
      .populate("customer", "name phone email loyaltyPoints")
      .populate("coupon", "code discountType discountValue")
      .populate("paymentMethod", "name type methodName")
      .populate({
        path: "items.product",
        populate: {
          path: "category",
          select: "name categoryName color",
        },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get active orders for Kitchen Display
// @route   GET /api/orders/kitchen
// @access  Private
router.get("/kitchen", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      status: "sent_to_kitchen",
      kitchenStatus: { $in: ["pending", "to_cook", "preparing", "completed"] },
    })
      .populate("table", "name tableName tableNumber floor capacity seats status")
      .populate("customer", "name phone")
      .populate("coupon", "code")
      .populate({
        path: "items.product",
        populate: {
          path: "category",
          select: "name categoryName color",
        },
      })
      .sort({ updatedAt: 1 });

    res.json({ success: true, data: orders, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get active order for a table
// @route   GET /api/orders/active-table/:tableId
// @access  Private
router.get("/active-table/:tableId", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      table: req.params.tableId,
      status: { $in: ["draft", "sent_to_kitchen"] },
    })
      .populate("table", "name tableName tableNumber capacity seats status floor")
      .populate("customer", "name phone email loyaltyPoints")
      .populate("coupon", "code discountType discountValue")
      .populate("paymentMethod", "name type methodName")
      .populate({
        path: "items.product",
        populate: {
          path: "category",
          select: "name categoryName color",
        },
      });

    res.json({ success: true, data: order, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single order by id
// @route   GET /api/orders/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await populateOrder(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create draft order
// @route   POST /api/orders
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { session, table, customer, items = [], couponCode } = req.body;

    if (!session || !table) {
      return res.status(400).json({
        success: false,
        message: "Session and table are required",
      });
    }

    const posSession = await POSSession.findById(session);

    if (!posSession || posSession.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Active POS session is required",
      });
    }

    const targetTable = await Table.findById(table);

    if (!targetTable) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    const existingOrder = await Order.findOne({
      table,
      status: { $in: ["draft", "sent_to_kitchen"] },
    });

    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Table already has an active order. Resume that order instead.",
        data: existingOrder,
        order: existingOrder,
      });
    }

    const { orderItems, subtotal } = await buildOrderItemsAndTotals(items);
    const coupon = couponCode ? await resolveCoupon(couponCode) : null;
    const discount = await calculateCouponDiscount(coupon?._id, subtotal);

    const taxRate = 0.05;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * taxRate;
    const total = taxableAmount + tax;

    const orderCount = await Order.countDocuments();
    const orderNumber = `POS-${new Date().getFullYear()}-${String(orderCount + 1).padStart(5, "0")}`;

    const newOrder = await Order.create({
      session,
      orderNumber,
      table,
      customer: customer || undefined,
      items: orderItems,
      subtotal,
      discount,
      coupon: coupon?._id || undefined,
      tax,
      total,
      status: "draft",
      kitchenStatus: "pending",
    });

    const populatedOrder = await populateOrder(newOrder._id);

    res.status(201).json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { customer, items, couponCode } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "paid" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a closed or cancelled order",
      });
    }

    if (items && order.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Cannot change items after order is sent to kitchen",
      });
    }

    if (customer !== undefined) {
      order.customer = customer || undefined;
    }

    await recalculateOrderTotals(order, items, couponCode);

    const updatedOrder = await order.save();
    const populatedOrder = await populateOrder(updatedOrder._id);

    if (order.status === "sent_to_kitchen") {
      emitOrderUpdated(req, populatedOrder, "order_updated");
    }

    res.json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Send order to kitchen
// @route   POST/PATCH /api/orders/:id/send-to-kitchen
// @access  Private
const sendToKitchenHandler = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Order must be in draft status to send to kitchen",
      });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot send empty order to kitchen",
      });
    }

    order.status = "sent_to_kitchen";
    order.kitchenStatus = "to_cook";

    await order.save();

    await Table.findByIdAndUpdate(order.table, { status: "occupied" });

    const populatedOrder = await populateOrder(order._id);

    if (req.io) {
      req.io.emit("order_sent_to_kitchen", populatedOrder);
      req.io.emit("order_updated", populatedOrder);
      emitTableStatus(req, order.table, "occupied");
    }

    res.json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post("/:id/send-to-kitchen", protect, sendToKitchenHandler);
router.patch("/:id/send-to-kitchen", protect, sendToKitchenHandler);

// @desc    Update kitchen status
// @route   PUT/PATCH /api/orders/:id/kitchen-status
// @access  Private
const kitchenStatusHandler = async (req, res) => {
  try {
    const kitchenStatus = req.body.kitchenStatus || req.body.status;

    if (!kitchenStatus || !KITCHEN_STATUSES.includes(kitchenStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid kitchen status. Allowed: pending, to_cook, preparing, completed",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "sent_to_kitchen") {
      return res.status(400).json({
        success: false,
        message: "Order is not in the kitchen workflow",
      });
    }

    order.kitchenStatus = kitchenStatus;

    await order.save();

    if (kitchenStatus === "completed") {
      await Table.findByIdAndUpdate(order.table, { status: "payment_pending" });
    }

    const populatedOrder = await populateOrder(order._id);

    if (req.io) {
      req.io.emit("kitchen_status_updated", populatedOrder);
      req.io.emit("order_updated", populatedOrder);

      if (kitchenStatus === "completed") {
        emitTableStatus(req, order.table, "payment_pending");
      }
    }

    res.json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.put("/:id/kitchen-status", protect, kitchenStatusHandler);
router.patch("/:id/kitchen-status", protect, kitchenStatusHandler);

// @desc    Toggle individual item completion
// @route   PUT/PATCH /api/orders/:id/items/:itemId/toggle-complete
// @access  Private
const toggleItemCompleteHandler = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "sent_to_kitchen") {
      return res.status(400).json({
        success: false,
        message: "Order is not in the kitchen workflow",
      });
    }

    let item = order.items.id(req.params.itemId);

    if (!item) {
      item = order.items.find(
        (i) => i.product && String(i.product) === String(req.params.itemId)
      );
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in order",
      });
    }

    item.isCompleted = !item.isCompleted;

    await order.save();

    const populatedOrder = await populateOrder(order._id);

    if (req.io) {
      req.io.emit("order_updated", populatedOrder);
      req.io.emit("kitchen_status_updated", populatedOrder);
    }

    res.json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.put("/:id/items/:itemId/toggle-complete", protect, toggleItemCompleteHandler);
router.patch("/:id/items/:itemId/toggle-complete", protect, toggleItemCompleteHandler);

// @desc    Pay order
// @route   POST /api/orders/:id/pay
// @access  Private
const payOrderHandler = async (req, res) => {
  try {
    const paymentMethodInput =
      req.body.paymentMethodId ||
      req.body.paymentMethod ||
      req.body.methodId ||
      req.body.method;

    const cashReceived = Number(
      req.body.cashReceived || req.body.receivedAmount || req.body.amountReceived || 0
    );

    if (!paymentMethodInput) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "sent_to_kitchen" || order.kitchenStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Payment is locked. The order must be sent to the kitchen and marked completed first.",
      });
    }

    let paymentMethodId = paymentMethodInput;

    if (!isValidObjectId(paymentMethodId)) {
      try {
        const PaymentMethod = require("../models/PaymentMethod");

        const foundMethod = await PaymentMethod.findOne({
          name: new RegExp(`^${String(paymentMethodInput)}$`, "i"),
        });

        if (foundMethod) {
          paymentMethodId = foundMethod._id;
        }
      } catch {
        // ignore optional payment method model lookup
      }
    }

    if (!isValidObjectId(paymentMethodId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method. Please configure Cash/Card/UPI payment methods from Admin.",
      });
    }

    const payment = await Payment.create({
      order: order._id,
      paymentMethod: paymentMethodId,
      amount: order.total,
      transactionRef: req.body.transactionRef || req.body.reference || "",
      status: "completed",
    });

    order.status = "paid";
    order.paymentMethod = paymentMethodId;

    await order.save();

    await Table.findByIdAndUpdate(order.table, { status: "available" });

    if (order.customer) {
      try {
        const Customer = require("../models/Customer");
        const pointsEarned = Math.floor(Number(order.total || 0) / 10);

        await Customer.findByIdAndUpdate(order.customer, {
          $inc: { loyaltyPoints: pointsEarned },
        });
      } catch {
        // loyalty points are optional
      }
    }

    const populatedOrder = await populateOrder(order._id);

    if (req.io) {
      req.io.emit("order_paid", populatedOrder);
      req.io.emit("order_updated", populatedOrder);
      emitTableStatus(req, order.table, "available");
    }

    res.json({
      success: true,
      data: populatedOrder,
      order: populatedOrder,
      payment,
      changeDue: cashReceived ? Math.max(0, cashReceived - Number(order.total || 0)) : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post("/:id/pay", protect, payOrderHandler);
router.post("/:id/payment", protect, payOrderHandler);

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "paid" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a paid or already cancelled order",
      });
    }

    order.status = "cancelled";

    await order.save();

    await Table.findByIdAndUpdate(order.table, { status: "available" });

    const populatedOrder = await populateOrder(order._id);

    if (req.io) {
      req.io.emit("order_cancelled", populatedOrder);
      req.io.emit("order_updated", populatedOrder);
      emitTableStatus(req, order.table, "available");
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: populatedOrder,
      order: populatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete draft/cancelled order
// @route   DELETE /api/orders/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["draft", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Only draft or cancelled orders can be deleted",
      });
    }

    const tableId = order.table;

    await Order.findByIdAndDelete(order._id);
    await Table.findByIdAndUpdate(tableId, { status: "available" });

    if (req.io) {
      req.io.emit("order_deleted", { orderId: req.params.id, tableId });
      emitTableStatus(req, tableId, "available");
    }

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;