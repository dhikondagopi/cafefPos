const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'payment_pending', 'inactive', 'reserved'],
    default: 'available'
  },
  posX: {
    type: Number,
    default: 10 // Percentage coordinate (0-100)
  },
  posY: {
    type: Number,
    default: 10 // Percentage coordinate (0-100)
  },
  width: {
    type: Number,
    default: 100 // Width of table in pixels
  },
  height: {
    type: Number,
    default: 100 // Height of table in pixels
  },
  shape: {
    type: String,
    enum: ['round', 'square'],
    default: 'square'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Table', TableSchema);
