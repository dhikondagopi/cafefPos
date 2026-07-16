const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Table = require("../models/Table");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not allowed`,
      });
    }

    next();
  };
};

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in backend .env");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getOrderId = (body) => {
  return body.order || body.orderId || body.order_id;
};

const getPaymentMethod = (body) => {
  return body.method || body.paymentMethod || body.payment_method || "Cash";
};

const getOrderAmount = (order, body = {}) => {
  return (
    Number(body.amount) ||
    Number(body.totalAmount) ||
    Number(body.total) ||
    Number(order.totalAmount) ||
    Number(order.total) ||
    Number(order.grandTotal) ||
    0
  );
};

const markOrderPaidAndReleaseTable = async ({ order, method, req }) => {
  order.status = "paid";
  order.paymentStatus = "paid";
  order.paymentMethod = method;
  order.paidAt = new Date();

  await order.save();

  const tableId = order.table || order.tableId;

  if (tableId) {
    await Table.findByIdAndUpdate(tableId, {
      status: "available",
      currentOrder: null,
    });
  }

  const io = req.app.get("io") || req.io;

  if (io) {
    io.emit("order_paid", {
      orderId: order._id,
      tableId,
    });

    if (tableId) {
      io.emit("table_status_updated", {
        tableId,
        status: "available",
      });
    }
  }

  return tableId;
};

// @route   GET /api/payments
// @desc    Get all payments
// @access  Admin, Employee, Cashier
router.get(
  "/",
  protect,
  allowRoles("admin", "employee", "cashier"),
  async (req, res) => {
    try {
      const payments = await Payment.find({})
        .populate("order")
        .populate("customer", "name phone email")
        .populate("createdBy", "name email role")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: payments.length,
        data: payments,
        payments,
      });
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch payments",
      });
    }
  }
);

// @route   POST /api/payments
// @desc    Offline payment: Cash / UPI / Card manual
// @access  Admin, Employee, Cashier
router.post(
  "/",
  protect,
  allowRoles("admin", "employee", "cashier"),
  async (req, res) => {
    try {
      console.log("OFFLINE PAYMENT BODY:", req.body);

      const orderId = getOrderId(req.body);
      const method = getPaymentMethod(req.body);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order id is required",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      const amount = getOrderAmount(order, req.body);

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid payment amount is required",
        });
      }

      const receivedAmount =
        Number(req.body.receivedAmount) ||
        Number(req.body.received) ||
        Number(req.body.cashReceived) ||
        amount;

      const changeAmount = Math.max(receivedAmount - amount, 0);

      const payment = await Payment.create({
        order: order._id,
        customer: order.customer || req.body.customer || null,
        method,
        paymentMethod: method,
        amount,
        totalAmount: amount,
        receivedAmount,
        changeAmount,
        status: "completed",
        paidAt: new Date(),
        createdBy: req.user._id,
      });

      const tableId = await markOrderPaidAndReleaseTable({
        order,
        method,
        req,
      });

      const populatedPayment = await Payment.findById(payment._id)
        .populate("order")
        .populate("customer", "name phone email")
        .populate("createdBy", "name email role");

      const io = req.app.get("io") || req.io;

      if (io) {
        io.emit("payment_completed", {
          payment: populatedPayment,
          orderId: order._id,
          tableId,
        });
      }

      res.status(201).json({
        success: true,
        message: "Payment completed successfully",
        data: populatedPayment,
        payment: populatedPayment,
        order,
      });
    } catch (error) {
      console.error("Create offline payment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to complete payment",
      });
    }
  }
);

// @route   POST /api/payments/razorpay/order
// @desc    Create Razorpay order
// @access  Admin, Employee, Cashier
router.post(
  "/razorpay/order",
  protect,
  allowRoles("admin", "employee", "cashier"),
  async (req, res) => {
    try {
      const orderId = getOrderId(req.body);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order id is required",
        });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "POS order not found",
        });
      }

      const amount = getOrderAmount(order, req.body);

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required",
        });
      }

      const razorpay = getRazorpayInstance();

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: `pos_${String(order._id).slice(-8)}_${Date.now()}`,
        notes: {
          posOrderId: String(order._id),
          createdBy: String(req.user._id),
        },
      });

      res.status(201).json({
        success: true,
        message: "Razorpay order created successfully",
        key: process.env.RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        posOrderId: order._id,
        razorpayOrder,
        data: {
          key: process.env.RAZORPAY_KEY_ID,
          amount,
          currency: "INR",
          posOrderId: order._id,
          razorpayOrder,
        },
      });
    } catch (error) {
      console.error("Create Razorpay order error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create Razorpay order",
      });
    }
  }
);

// @route   POST /api/payments/razorpay/verify
// @desc    Verify Razorpay payment signature and mark POS order paid
// @access  Admin, Employee, Cashier
router.post(
  "/razorpay/verify",
  protect,
  allowRoles("admin", "employee", "cashier"),
  async (req, res) => {
    try {
      const {
        orderId,
        posOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const finalPosOrderId = posOrderId || orderId;

      if (
        !finalPosOrderId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing Razorpay verification fields",
        });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment signature verification failed",
        });
      }

      const order = await Order.findById(finalPosOrderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "POS order not found",
        });
      }

      const amount = getOrderAmount(order, req.body);

      const payment = await Payment.create({
        order: order._id,
        customer: order.customer || null,
        method: "Razorpay",
        paymentMethod: "Razorpay",
        amount,
        totalAmount: amount,
        receivedAmount: amount,
        changeAmount: 0,
        transactionRef: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        gatewayResponse: req.body,
        status: "completed",
        paidAt: new Date(),
        createdBy: req.user._id,
      });

      const tableId = await markOrderPaidAndReleaseTable({
        order,
        method: "Razorpay",
        req,
      });

      const populatedPayment = await Payment.findById(payment._id)
        .populate("order")
        .populate("customer", "name phone email")
        .populate("createdBy", "name email role");

      const io = req.app.get("io") || req.io;

      if (io) {
        io.emit("payment_completed", {
          payment: populatedPayment,
          orderId: order._id,
          tableId,
        });
      }

      res.status(201).json({
        success: true,
        message: "Razorpay payment verified successfully",
        data: populatedPayment,
        payment: populatedPayment,
        order,
      });
    } catch (error) {
      console.error("Verify Razorpay payment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to verify Razorpay payment",
      });
    }
  }
);

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Admin, Employee, Cashier
router.get(
  "/:id",
  protect,
  allowRoles("admin", "employee", "cashier"),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate("order")
        .populate("customer", "name phone email")
        .populate("createdBy", "name email role");

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.json({
        success: true,
        data: payment,
        payment,
      });
    } catch (error) {
      console.error("Get payment error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch payment",
      });
    }
  }
);

module.exports = router;