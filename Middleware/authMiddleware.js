const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp < currentTime) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
});


// Middleware to ensure user has verified their email
const protectAndVerify = asyncHandler(async (req, res, next) => {
  await protect(req, res, async () => {
    if (!req.user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email to access this feature.' });
    }
    next();
  });
});

// Middleware to check if the user is an admin (authorization)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin.' });
  }
};

module.exports = { protect, protectAndVerify, admin };
