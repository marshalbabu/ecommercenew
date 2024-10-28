const express = require('express');
const asyncHandler = require('express-async-handler');
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const router = express.Router();
const adminMiddleware = require('../Middleware/authMiddleware');
const { protect, admin } = require('../Middleware/authMiddleware');

// Use admin middleware
router.use(protect);  // Protect all routes for logged-in users
router.use('/admin', admin); // Restrict certain routes to admins only
// Admin stats route
router.get('/stats', asyncHandler(async (req, res) => {
  console.log("Stats API Hit"); // Log API access
  // Fetch total sales, orders, users, and low stock products
  const totalSales = await Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }]);
  const orders = await Order.countDocuments();
  const customers = await User.countDocuments();
  const pendingOrders = await Order.countDocuments({ isDelivered: false });
  const lowStock = await Product.countDocuments({ stock: { $lt: 5 } });
  const totalProducts = await Product.countDocuments();
// Log values fetched from database
console.log('Total Sales:', totalSales[0]?.totalSales || 0);
console.log('Total Orders:', orders);
console.log('Total Customers:', customers);
console.log('Pending Orders:', pendingOrders);
console.log('Low Stock Products:', lowStock);
console.log('Total Products:', totalProducts);

  res.json({
    totalSales: totalSales[0]?.totalSales || 0,
    orders,
    customers,
    pendingOrders,
    lowStock,
    totalProducts,
  });
}));

// Route for Inventory Summary
router.get(
  '/inventory-summary',
  asyncHandler(async (req, res) => {
    try {
      console.log("Inventory Summary API Hit"); // Log API access
      const [lowStockProducts, totalProducts] = await Promise.all([
        Product.find({ stock: { $lt: 5 } }),    // Fetch low stock products
        Product.countDocuments(),               // Fetch total product count
      ]);
// Log values fetched from database
console.log('Low Stock Products:', lowStockProducts);
console.log('Total Products:', totalProducts);
      res.json({
        totalProducts,
        lowStockProducts,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch inventory summary', error });
    }
  })
);

// Route for Order Summary
router.get(
  '/orders-summary',
  asyncHandler(async (req, res) => {
    try {
      const [totalOrders, pendingOrders, deliveredOrders, totalRevenue] = await Promise.all([
        Order.countDocuments(),                              // Fetch total orders
        Order.countDocuments({ isDelivered: false }),        // Fetch pending orders
        Order.countDocuments({ isDelivered: true }),         // Fetch delivered orders
        Order.aggregate([                                    // Fetch total revenue
          { $match: { isPaid: true } },
          { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
        ]),
      ]);

      res.json({
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue: totalRevenue[0] ? totalRevenue[0].totalRevenue : 0,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch orders summary', error });
    }
  })
);
// User management with search, filtering, and pagination
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', role } = req.query;

    // Search by name or email
    const searchQuery = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };

    // If role is provided, add role filter
    if (role) {
      searchQuery.role = role;
    }

    // Fetch filtered users with pagination
    const users = await User.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(searchQuery);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  })
);

//Products
// Product management with filtering, pagination, and low stock
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', category, lowStock } = req.query;

    // Build search query for products
    const searchQuery = {
      name: { $regex: search, $options: 'i' },
    };

    // Filter by category if provided
    if (category) {
      searchQuery.category = category;
    }

    // If low stock filter is active
    if (lowStock === 'true') {
      searchQuery.stock = { $lt: 5 };
    }

    // Fetch filtered products with pagination
    const products = await Product.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Product.countDocuments(searchQuery);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  })
);
// Route for User Activity Summary
router.get(
  '/user-activity',
  asyncHandler(async (req, res) => {
    try {
      const [recentUsers, totalUsers] = await Promise.all([
        User.find({
          createdAt: { $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) },  // Recent users from last 30 days
        }).select('name email createdAt'),
        User.countDocuments(),  // Total users count
      ]);

      res.json({
        totalUsers,
        recentUsers,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user activity', error });
    }
  })
);

module.exports = router;
