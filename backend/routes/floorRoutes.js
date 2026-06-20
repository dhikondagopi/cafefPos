const express = require('express');
const router = express.Router();
const Floor = require('../models/Floor');
const Table = require('../models/Table');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all floors
// @route   GET /api/floors
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const floors = await Floor.find({}).sort({ createdAt: 1 });
    res.json({ success: true, data: floors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a floor (Admin only)
// @route   POST /api/floors
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, color, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Floor name is required' });
  }

  try {
    const exists = await Floor.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Floor name already exists' });
    }

    const floor = await Floor.create({
      name,
      color: color || '#f3f4f6',
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json({ success: true, data: floor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a floor (Admin only)
// @route   PUT /api/floors/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, color, isActive } = req.body;

  try {
    const floor = await Floor.findById(req.params.id);

    if (floor) {
      floor.name = name || floor.name;
      floor.color = color || floor.color;
      if (isActive !== undefined) {
        floor.isActive = isActive;
      }

      const updatedFloor = await floor.save();
      res.json({ success: true, data: updatedFloor });
    } else {
      res.status(404).json({ success: false, message: 'Floor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a floor (Admin only)
// @route   DELETE /api/floors/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (floor) {
      // Check if tables are assigned to this floor
      const tablesCount = await Table.countDocuments({ floor: req.params.id });
      if (tablesCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete floor: it has ${tablesCount} table(s) configured.`
        });
      }

      await Floor.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Floor deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Floor not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
