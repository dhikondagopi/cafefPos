const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone are required' });
  }

  try {
    const exists = await Customer.findOne({ phone });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already exists' });
    }

    const customer = await Customer.create({ name, email, phone });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, email, phone, loyaltyPoints } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.name = name || customer.name;
      customer.email = email !== undefined ? email : customer.email;
      customer.phone = phone || customer.phone;
      if (loyaltyPoints !== undefined) {
        customer.loyaltyPoints = loyaltyPoints;
      }

      const updatedCustomer = await customer.save();
      res.json({ success: true, data: updatedCustomer });
    } else {
      res.status(404).json({ success: false, message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a customer (Admin only)
// @route   DELETE /api/customers/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      await Customer.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Customer deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
