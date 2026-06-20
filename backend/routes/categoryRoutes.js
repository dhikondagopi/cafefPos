const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  try {
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ name, description, color });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, description, color } = req.body;

  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description !== undefined ? description : category.description;
      category.color = color || category.color;

      const updatedCategory = await category.save();
      res.json({ success: true, data: updatedCategory });
    } else {
      res.status(404).json({ success: false, message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      // Check if products belong to this category
      const productsCount = await Product.countDocuments({ category: req.params.id });
      if (productsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category: it is assigned to ${productsCount} product(s).`
        });
      }

      await Category.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Category deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
