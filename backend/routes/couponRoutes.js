const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all coupons (Admin only)
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ code: 1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Validate a coupon code
// @route   GET /api/coupons/validate/:code
// @access  Private
router.get('/validate/:code', protect, async (req, res) => {
  const code = req.params.code.toUpperCase();

  try {
    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a coupon (Admin only)
// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { code, discountType, discountValue, isActive, expirationDate } = req.body;

  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Code and discount value are required' });
  }

  try {
    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      isActive: isActive !== undefined ? isActive : true,
      expirationDate: expirationDate || undefined
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a coupon (Admin only)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { code, discountType, discountValue, isActive, expirationDate } = req.body;

  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      coupon.code = code ? code.toUpperCase() : coupon.code;
      coupon.discountType = discountType || coupon.discountType;
      coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
      coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
      coupon.expirationDate = expirationDate !== undefined ? expirationDate : coupon.expirationDate;

      const updatedCoupon = await coupon.save();
      res.json({ success: true, data: updatedCoupon });
    } else {
      res.status(404).json({ success: false, message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a coupon (Admin only)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      await Coupon.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Coupon deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
