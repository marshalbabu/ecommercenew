const express = require('express');
const { protect, admin } = require('../Middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const Notification = require('../models/notification'); // For sending notifications
const router = express.Router();

// Helper function to create notifications
const createNotification = async (message, type) => {
  const notification = new Notification({ message, type });
  await notification.save();
};

// Admin: Get all orders
router.get(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  })
);

// Admin: Update order status (e.g., shipped, delivered)
router.put(
  '/:orderId/status',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { status } = req.body;

    if (!['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    order.status = status;

    if (status === 'Shipped') {
      order.isShipped = true;
      order.shippedAt = Date.now();
      await createNotification(`Order #${order._id} has been shipped`, 'order');
    }

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await createNotification(`Order #${order._id} has been delivered`, 'order');
    }

    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  })
);

// Admin: Cancel or Refund an order
router.post(
  '/cancel/:orderId',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isShipped) {
      return res.status(400).json({ message: 'Cannot cancel shipped orders' });
    }

    order.status = 'Cancelled';
    await order.save();

    // Create notification
    await createNotification(`Order #${order._id} has been cancelled`, 'order');

    res.json({ message: 'Order cancelled', order });
  })
);

// Admin: Restock a product
router.put(
  '/restock/:productId',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock += quantity;
    await product.save();

    // Send a notification about restocking
    await createNotification(`${product.name} has been restocked. New stock: ${product.stock}`, 'low-stock');

    res.json({ message: `${product.name} restocked successfully`, product });
  })
);

module.exports = router;
