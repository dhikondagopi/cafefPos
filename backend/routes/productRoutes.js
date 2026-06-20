const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name').sort({ name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, authorize('admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  let { name, description, price, category, image, imageUrl, photo, thumbnail, stock, isAvailable } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
  }

  try {
    if (req.file) {
      const relativePath = `/uploads/products/${req.file.filename}`;
      image = relativePath;
      imageUrl = relativePath;
      photo = relativePath;
      thumbnail = relativePath;
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image: image || '',
      imageUrl: imageUrl || '',
      photo: photo || '',
      thumbnail: thumbnail || '',
      stock: stock !== undefined ? stock : 0,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name');
    res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  let { name, description, price, category, image, imageUrl, photo, thumbnail, stock, isAvailable } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description !== undefined ? description : product.description;
      product.price = price !== undefined ? price : product.price;
      product.category = category || product.category;
      product.stock = stock !== undefined ? stock : product.stock;
      product.isAvailable = isAvailable !== undefined ? isAvailable : product.isAvailable;

      if (req.file) {
        const relativePath = `/uploads/products/${req.file.filename}`;
        product.image = relativePath;
        product.imageUrl = relativePath;
        product.photo = relativePath;
        product.thumbnail = relativePath;
      } else {
        product.image = image !== undefined ? image : product.image;
        product.imageUrl = imageUrl !== undefined ? imageUrl : product.imageUrl;
        product.photo = photo !== undefined ? photo : product.photo;
        product.thumbnail = thumbnail !== undefined ? thumbnail : product.thumbnail;
      }

      const updatedProduct = await product.save();
      const populatedProduct = await Product.findById(updatedProduct._id).populate('category', 'name');
      res.json({ success: true, data: populatedProduct });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: 'Product deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
