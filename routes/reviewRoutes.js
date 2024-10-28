const express = require('express');
const asyncHandler = require('express-async-handler');
const Review = require('../models/review');  // Import the Review model
const Product = require('../models/product');  // Import the Product model
const { protectAndVerify, protect, admin } = require('../Middleware/authMiddleware');  // Import JWT auth, verify, and admin middleware
const router = express.Router();

// POST a review for a specific product (Protected route with email verification)
router.post(
  '/:productId/review',
  protectAndVerify, // Ensure the user is logged in and verified
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    // Check if product exists
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create a new review
    const review = new Review({
      user: req.user._id, // Add user ID from JWT token
      product: req.params.productId,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json(review);
  })
);

// GET all reviews for a specific product
router.get(
  '/:productId/reviews',
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name');
    res.json(reviews);
  })
);

// DELETE a review by ID (Allow users to delete their own reviews or Admins to delete any)
router.delete(
  '/:reviewId',
  protectAndVerify,  // Ensure the user is logged in and verified
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Allow the review author or an admin to delete the review
    if (review.user.toString() === req.user._id.toString() || req.user.isAdmin) {
      await review.deleteOne();
      res.json({ message: 'Review deleted successfully' });
    } else {
      res.status(403).json({ message: 'Not authorized to delete this review' });
    }
  })
);

module.exports = router;
