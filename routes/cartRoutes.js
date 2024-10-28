const express = require('express');
const Cart = require('../models/cart'); // Import Cart model
const Product = require('../models/product'); // Import Product model
const { protect } = require('../Middleware/authMiddleware'); // To protect route
const asyncHandler = require('express-async-handler'); // Import asyncHandler
const router = express.Router();

// Add item to cart (works for both guest and logged-in users)
router.post(
  '/add',
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    // Validate product ID and quantity
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid product or quantity' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for expiration
    if (product.expirationDate && new Date(product.expirationDate) < new Date()) {
      return res.status(400).json({ message: 'This product has expired' });
    }

    // Stock check
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart;

    // For logged-in users, check if the user is authenticated
    if (req.user) {
      // Find or create the cart for the logged-in user in the database
      cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
      }
    } else {
      // For guest users, use session-based cart
      cart = req.session.cart || { items: [], totalPrice: 0 };
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(item => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    // Calculate total price
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + item.quantity * product.price;
    }, 0);

    // Save cart to session (for guest users) or DB (for logged-in users)
    if (req.user) {
      await cart.save(); // Save cart to MongoDB for logged-in users
    } else {
      req.session.cart = cart; // Save cart in session for guest users
    }

    res.status(200).json(cart);
  })
);

// View cart (for guest users and logged-in users)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let cart;
    if (req.user) {
      // Get cart from database for logged-in users
      cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    } else {
      // Get cart from session for guest users
      cart = req.session.cart || { items: [], totalPrice: 0 };
    }

    res.status(200).json(cart);
  })
);

// Clear cart (for both guest and logged-in users)
router.post(
  '/clear',
  asyncHandler(async (req, res) => {
    if (req.user) {
      // Clear cart for logged-in users
      await Cart.findOneAndDelete({ user: req.user._id });
    } else {
      // Clear session cart for guest users
      req.session.cart = null;
    }

    res.status(200).json({ message: 'Cart cleared' });
  })
);

// Migrate guest cart to user cart after login
router.post(
  '/migrate',
  protect, // User must be logged in to migrate cart
  asyncHandler(async (req, res) => {
    const guestCart = req.session.cart;

    if (!guestCart || guestCart.items.length === 0) {
      return res.status(400).json({ message: 'No guest cart to migrate' });
    }

    // Find or create the cart for the logged-in user
    let userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      userCart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
    }

    // Migrate items from guest cart to user cart
    guestCart.items.forEach(guestItem => {
      const existingItem = userCart.items.find(item => item.product.toString() === guestItem.product);

      if (existingItem) {
        // If the product already exists in the user's cart, update quantity
        existingItem.quantity += guestItem.quantity;
      } else {
        // Else, add the guest cart item to the user's cart
        userCart.items.push(guestItem);
      }
    });

    // Update total price
    userCart.totalPrice += guestCart.totalPrice;

    // Save the migrated user cart to the database
    await userCart.save();

    // Clear guest cart from session
    req.session.cart = null;

    res.status(200).json({ message: 'Cart migrated successfully', cart: userCart });
  })
);

// Cart summary for logged-in user
router.get(
  '/summary',
  protect, // Ensure the user is logged in
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find the cart for the logged-in user
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: 'Cart is empty' });
    }

    // Calculate total items and total price
    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0);

    const summary = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        total: item.quantity * item.product.price
      })),
      totalItems,
      totalPrice
    };

    // Return the cart summary
    res.json(summary);
  })
);

module.exports = router;
