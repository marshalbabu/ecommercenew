const express = require('express');
const { protectAndVerify } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const router = express.Router();

// Function to lock inventory (reduce stock)
const lockInventory = async (orderItems, io) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error(`Product ${item.product} not found`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    // Reduce stock to "lock" the inventory
    product.stock -= item.quantity;
    await product.save(); // Save the updated stock

    // Check if the stock is below a certain threshold (e.g., 5)
    const lowStockThreshold = 5;
    if (product.stock <= lowStockThreshold) {
      // Emit a low-stock alert to admins via Socket.io
      io.emit('lowStockAlert', {
        productId: product._id,
        productName: product.name,
        remainingStock: product.stock,
      });
    }
  }
};

// Function to restore inventory (increase stock) in case of failure
const restoreInventory = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (product) {
      product.stock += item.quantity; // Restore stock
      await product.save(); // Save the updated stock
    }
  }
};

// Checkout route with Cash on Delivery and Online Payment
router.post(
  '/checkout',
  protectAndVerify, // Ensure user is logged in and email verified
  asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;
    const io = req.app.get('socketio'); // Get Socket.io instance

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Revalidate stock and price before creating the order
    let validatedTotalPrice = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      if (product.price !== item.price) {
        return res.status(400).json({ message: `Price mismatch for ${product.name}` });
      }

      // Calculate the validated total price
      validatedTotalPrice += item.quantity * product.price;
    }

    // Add taxes, shipping, and discounts
    const tax = validatedTotalPrice * 0.10; // Example tax rate: 10%
    const shippingFee = 20; // Example flat shipping fee
    const discount = req.body.discount || 0; // Apply discount if applicable
    const finalTotalPrice = validatedTotalPrice + tax + shippingFee - discount;

    // Check if total price from client matches calculated price
    if (totalPrice !== finalTotalPrice) {
      return res.status(400).json({ message: 'Price mismatch, please review your order.' });
    }

    try {
      // Lock inventory by reducing stock and send low stock alerts if needed
      await lockInventory(orderItems, io);

      // Proceed with order creation
      const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        totalPrice: finalTotalPrice,
        tax,
        shippingFee,
        discount,
      });

      // For Cash on Delivery, complete the order immediately
      if (paymentMethod === 'Cash on Delivery') {
        order.isPaid = false; // COD means not yet paid
        const createdOrder = await order.save();

        // Notify the admin about the new order
        io.emit('newOrder', { orderId: createdOrder._id, userName: req.user.name });

        return res.status(201).json({ message: 'Order placed successfully with Cash on Delivery', order: createdOrder });
      }

      // Dummy payment flow for online payment
      if (paymentMethod === 'Online Payment') {
        // Simulate online payment success (this should be integrated with a real payment gateway)
        const paymentSuccess = true; // Simulating success

        if (paymentSuccess) {
          order.isPaid = true;
          order.paidAt = Date.now(); // Mark as paid
          const createdOrder = await order.save();

          // Notify the admin about the new order
          io.emit('newOrder', { orderId: createdOrder._id, userName: req.user.name });

          return res.status(201).json({ message: 'Order placed successfully with Online Payment', order: createdOrder });
        } else {
          // If payment fails, restore the stock
          await restoreInventory(orderItems);
          return res.status(400).json({ message: 'Payment failed, order not completed' });
        }
      }
    } catch (error) {
      // In case of error, restore the inventory to unlock the stock
      await restoreInventory(orderItems);
      return res.status(400).json({ message: error.message });
    }
  })
);

// Restore inventory in case of payment failure or abandoned checkout
router.post(
  '/restore',
  protectAndVerify, // Ensure user is logged in and email verified
  asyncHandler(async (req, res) => {
    const { orderItems } = req.body;

    try {
      // Restore the locked inventory
      await restoreInventory(orderItems);
      res.status(200).json({ message: 'Inventory restored successfully' });
    } catch (error) {
      return res.status(400).json({ message: 'Failed to restore inventory' });
    }
  })
);

module.exports = router;
