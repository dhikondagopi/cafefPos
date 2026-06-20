const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const tables = await Table.find({}).populate('floor', 'name').sort({ name: 1 });
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get tables by floor
// @route   GET /api/tables/floor/:floorId
// @access  Private
router.get('/floor/:floorId', protect, async (req, res) => {
  try {
    const tables = await Table.find({ floor: req.params.floorId }).populate('floor', 'name');
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a table (Admin only)
// @route   POST /api/tables
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, capacity, floor, posX, posY, width, height, shape } = req.body;

  if (!name || !capacity || !floor) {
    return res.status(400).json({ success: false, message: 'Name, capacity, and floor are required' });
  }

  try {
    const table = await Table.create({
      name,
      capacity,
      floor,
      posX: posX !== undefined ? posX : 10,
      posY: posY !== undefined ? posY : 10,
      width: width !== undefined ? width : 100,
      height: height !== undefined ? height : 100,
      shape: shape || 'square',
      status: 'available'
    });

    const populatedTable = await Table.findById(table._id).populate('floor', 'name');
    res.status(201).json({ success: true, data: populatedTable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a table (Admin or Employee)
// @route   PUT /api/tables/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, capacity, floor, posX, posY, width, height, shape, status } = req.body;

  try {
    const table = await Table.findById(req.params.id);

    if (table) {
      // Allow status updates by employees, but geometry changes require admin
      if (req.user.role !== 'admin' && (name || capacity || floor || posX || posY || width || height || shape)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only administrators can configure layout parameters.'
        });
      }

      table.name = name || table.name;
      table.capacity = capacity !== undefined ? capacity : table.capacity;
      table.floor = floor || table.floor;
      table.posX = posX !== undefined ? posX : table.posX;
      table.posY = posY !== undefined ? posY : table.posY;
      table.width = width !== undefined ? width : table.width;
      table.height = height !== undefined ? height : table.height;
      table.shape = shape || table.shape;
      table.status = status || table.status;

      const updatedTable = await table.save();
      const populatedTable = await Table.findById(updatedTable._id).populate('floor', 'name');
      res.json({ success: true, data: populatedTable });
    } else {
      res.status(404).json({ success: false, message: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a table (Admin only)
// @route   DELETE /api/tables/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (table) {
      await Table.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Table deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Table not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
