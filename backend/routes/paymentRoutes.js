const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all payment methods
// @route   GET /api/payments/methods
// @access  Private
router.get('/methods', protect, async (req, res) => {
  try {
    const methods = await PaymentMethod.find({}).sort({ name: 1 });
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a payment method (Admin only)
// @route   POST /api/payments/methods
// @access  Private/Admin
router.post('/methods', protect, authorize('admin'), async (req, res) => {
  const { name, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Payment method name is required' });
  }

  try {
    const exists = await PaymentMethod.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Payment method already exists' });
    }

    const method = await PaymentMethod.create({
      name,
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a payment method (Admin only)
// @route   PUT /api/payments/methods/:id
// @access  Private/Admin
router.put('/methods/:id', protect, authorize('admin'), async (req, res) => {
  const { name, isActive } = req.body;

  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (method) {
      method.name = name || method.name;
      if (isActive !== undefined) {
        method.isActive = isActive;
      }

      const updatedMethod = await method.save();
      res.json({ success: true, data: updatedMethod });
    } else {
      res.status(404).json({ success: false, message: 'Payment method not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a payment method (Admin only)
// @route   DELETE /api/payments/methods/:id
// @access  Private/Admin
router.delete('/methods/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);

    if (method) {
      await PaymentMethod.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Payment method deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Payment method not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate({
        path: 'order',
        populate: [
          { path: 'table', select: 'name' },
          { path: 'session', select: 'user' }
        ]
      })
      .populate('paymentMethod', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
