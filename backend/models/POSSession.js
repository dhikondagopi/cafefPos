const mongoose = require('mongoose');

const POSSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date
  },
  openingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  closingBalance: {
    type: Number
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('POSSession', POSSessionSchema);
