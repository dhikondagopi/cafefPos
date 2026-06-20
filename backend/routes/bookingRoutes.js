const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Table = require('../models/Table');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('table', 'name capacity status floor')
      .sort({ bookingDate: 1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  const { customerName, customerPhone, customerEmail, table, bookingDate, numberOfGuests, status } = req.body;

  if (!customerName || !customerPhone || !table || !bookingDate || !numberOfGuests) {
    return res.status(400).json({
      success: false,
      message: 'Customer name, phone, table, date, and guests count are required'
    });
  }

  try {
    const targetTable = await Table.findById(table);
    if (!targetTable) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const booking = await Booking.create({
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      table,
      bookingDate,
      numberOfGuests,
      status: status || 'pending'
    });

    // If reservation is immediately confirmed, mark the table as reserved
    if (booking.status === 'confirmed') {
      await Table.findByIdAndUpdate(table, { status: 'reserved' });
      if (req.io) {
        req.io.emit('table_status_updated', { tableId: table, status: 'reserved' });
      }
    }

    const populated = await Booking.findById(booking._id).populate('table', 'name capacity status floor');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update booking details
// @route   PUT /api/bookings/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { customerName, customerPhone, customerEmail, table, bookingDate, numberOfGuests, status } = req.body;

  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldTable = booking.table;
    const oldStatus = booking.status;

    booking.customerName = customerName || booking.customerName;
    booking.customerPhone = customerPhone || booking.customerPhone;
    booking.customerEmail = customerEmail !== undefined ? customerEmail : booking.customerEmail;
    booking.table = table || booking.table;
    booking.bookingDate = bookingDate || booking.bookingDate;
    booking.numberOfGuests = numberOfGuests !== undefined ? numberOfGuests : booking.numberOfGuests;
    booking.status = status || booking.status;

    const updated = await booking.save();

    // Side-effects on Table status:
    // Case 1: Booking changed to confirmed
    if (updated.status === 'confirmed' && (oldStatus !== 'confirmed' || updated.table.toString() !== oldTable.toString())) {
      // Reserve new table
      await Table.findByIdAndUpdate(updated.table, { status: 'reserved' });
      if (req.io) {
        req.io.emit('table_status_updated', { tableId: updated.table, status: 'reserved' });
      }

      // If table changed, release old table (if it was previously confirmed)
      if (oldStatus === 'confirmed' && updated.table.toString() !== oldTable.toString()) {
        await Table.findByIdAndUpdate(oldTable, { status: 'available' });
        if (req.io) {
          req.io.emit('table_status_updated', { tableId: oldTable, status: 'available' });
        }
      }
    }
    // Case 2: Booking changed from confirmed to pending/cancelled
    else if (oldStatus === 'confirmed' && updated.status !== 'confirmed') {
      // Release table
      await Table.findByIdAndUpdate(updated.table, { status: 'available' });
      if (req.io) {
        req.io.emit('table_status_updated', { tableId: updated.table, status: 'available' });
      }
    }

    const populated = await Booking.findById(updated._id).populate('table', 'name capacity status floor');
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (booking) {
      const tableId = booking.table;
      const status = booking.status;

      await Booking.deleteOne({ _id: req.params.id });

      // If it was confirmed, set table back to available
      if (status === 'confirmed') {
        const otherConfirmedBookings = await Booking.countDocuments({
          table: tableId,
          status: 'confirmed'
        });
        if (otherConfirmedBookings === 0) {
          await Table.findByIdAndUpdate(tableId, { status: 'available' });
          if (req.io) {
            req.io.emit('table_status_updated', { tableId, status: 'available' });
          }
        }
      }

      res.json({ success: true, message: 'Booking removed successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
