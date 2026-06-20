const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Category = require('../models/Category');
const Table = require('../models/Table');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @desc    Get dashboard metrics summary
// @route   GET /api/reports/summary
// @access  Private/Admin
router.get('/summary', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. Total revenue & paid orders count
    const overallStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    const stats = overallStats[0] || { totalRevenue: 0, orderCount: 0, averageOrderValue: 0 };

    // 2. Draft & active kitchen orders counts
    const activeOrdersCount = await Order.countDocuments({
      status: { $in: ['draft', 'sent_to_kitchen'] }
    });

    // 3. Revenue by category
    const categoryStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantitySold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          _id: 1,
          categoryName: '$categoryDetails.name',
          revenue: 1,
          quantitySold: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 4. Revenue by Table
    const tableStats = await Order.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$table',
          revenue: { $sum: '$total' },
          visitCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'tables',
          localField: '_id',
          foreignField: '_id',
          as: 'tableDetails'
        }
      },
      { $unwind: '$tableDetails' },
      {
        $project: {
          _id: 1,
          tableName: '$tableDetails.name',
          revenue: 1,
          visitCount: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 5. Daily sales trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesTrend = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        revenue: stats.totalRevenue,
        orderCount: stats.orderCount,
        averageOrderValue: stats.averageOrderValue,
        activeOrdersCount,
        salesByCategory: categoryStats,
        salesByTable: tableStats,
        salesTrend: salesTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
