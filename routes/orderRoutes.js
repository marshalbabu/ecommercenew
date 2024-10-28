const express = require('express');
const { protectAndVerify } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const router = express.Router();

// Get all logged-in user's orders
router.get(
  '/myorders',
  protectAndVerify,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  })
);

// Get details of a specific order
router.get(
  '/myorders/:orderId',
  protectAndVerify,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  })
);

// Cancel an order before it's shipped
router.post(
  '/cancel/:orderId',
  protectAndVerify,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isShipped) {
      return res.status(400).json({ message: 'Cannot cancel shipped orders' });
    }

    // Restore inventory
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  })
);

// Update shipping or billing address of an existing order (before shipment)
router.put(
  '/update-address/:orderId',
  protectAndVerify,
  asyncHandler(async (req, res) => {
    const { shippingAddress, billingAddress } = req.body;

    const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.isShipped) {
      return res.status(400).json({ message: 'Cannot update address for shipped orders' });
    }

    order.shippingAddress = shippingAddress || order.shippingAddress;
    order.billingAddress = billingAddress || order.billingAddress;
    await order.save();

    res.json({ message: 'Address updated successfully', order });
  })
);

module.exports = router;
