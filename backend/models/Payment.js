const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    method: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Razorpay",
        "Online",
        "cash",
        "upi",
        "card",
        "razorpay",
        "online",
      ],
      default: "Cash",
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "UPI",
        "Card",
        "Razorpay",
        "Online",
        "cash",
        "upi",
        "card",
        "razorpay",
        "online",
      ],
      required: [true, "Payment method is required"],
      default: "Cash",
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    receivedAmount: {
      type: Number,
      default: 0,
    },

    changeAmount: {
      type: Number,
      default: 0,
    },

    transactionRef: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },

    gatewayResponse: {
      type: Object,
      default: {},
    },

    status: {
      type: String,
      enum: ["created", "completed", "failed", "refunded"],
      default: "completed",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.pre("save", function (next) {
  if (!this.paymentMethod && this.method) {
    this.paymentMethod = this.method;
  }

  if (!this.method && this.paymentMethod) {
    this.method = this.paymentMethod;
  }

  if (!this.totalAmount) {
    this.totalAmount = this.amount;
  }

  if (!this.receivedAmount) {
    this.receivedAmount = this.amount;
  }

  if (this.receivedAmount >= this.amount) {
    this.changeAmount = this.receivedAmount - this.amount;
  } else {
    this.changeAmount = 0;
  }

  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);