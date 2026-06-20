const express = require('express');
const router = express.Router();
const POSSession = require('../models/POSSession');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get active session for current user
// @route   GET /api/sessions/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const session = await POSSession.findOne({
      user: req.user._id,
      status: 'open'
    }).populate('user', 'name email role');

    if (session) {
      res.json({ success: true, exists: true, data: session });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Start/Open a new POS session
// @route   POST /api/sessions/start
// @access  Private
router.post('/start', protect, async (req, res) => {
  const { openingBalance } = req.body;

  if (openingBalance === undefined || openingBalance === null) {
    return res.status(400).json({ success: false, message: 'Opening balance is required' });
  }

  try {
    // Check if user already has an active open session
    const existingSession = await POSSession.findOne({
      user: req.user._id,
      status: 'open'
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active open session. Close it first before starting a new one.'
      });
    }

    const session = await POSSession.create({
      user: req.user._id,
      openingBalance,
      status: 'open',
      openedAt: new Date()
    });

    const populatedSession = await POSSession.findById(session._id).populate('user', 'name email role');
    res.status(201).json({ success: true, data: populatedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Close an active POS session
// @route   POST /api/sessions/close/:id
// @access  Private
router.post('/close/:id', protect, async (req, res) => {
  const { closingBalance } = req.body;

  if (closingBalance === undefined || closingBalance === null) {
    return res.status(400).json({ success: false, message: 'Closing balance is required' });
  }

  try {
    const session = await POSSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Session is already closed' });
    }

    // Check if cashier has any draft or sent_to_kitchen orders that aren't paid
    const pendingOrdersCount = await Order.countDocuments({
      session: session._id,
      status: { $in: ['draft', 'sent_to_kitchen'] }
    });

    if (pendingOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot close session. There are still ${pendingOrdersCount} active orders in draft or sent to kitchen. Please close or pay them first.`
      });
    }

    session.closingBalance = closingBalance;
    session.status = 'closed';
    session.closedAt = new Date();

    const savedSession = await session.save();
    res.json({ success: true, data: savedSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all sessions (Admin only)
// @route   GET /api/sessions
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const sessions = await POSSession.find({})
      .populate('user', 'name email role')
      .sort({ openedAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
