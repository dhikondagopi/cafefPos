const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionRef: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
