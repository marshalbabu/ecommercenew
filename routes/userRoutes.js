const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/user');  // Your User model
const asyncHandler = require('express-async-handler');
const router = express.Router();

// Helper function to generate JWT token
const generateAccessToken = (id, expiresIn = '1h') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (id, expiresIn = '7d') => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn });
};

// Register a new user and send verification email
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, guestCart } = req.body;  // Accept guestCart from request

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user (password hashing is handled in user schema pre-save hook)
    const user = await User.create({ name, email, password });

    // If there's a guest cart, migrate it to the user's cart
    if (guestCart && guestCart.items && guestCart.items.length > 0) {
      guestCart.items.forEach((item) => {
        user.addToCart(item.product, item.quantity, item.price);
      });
      await user.save();
    }

    // Generate a verification token
    const token = generateToken(user._id);

    // Send verification email using req.transporter
    const verificationUrl = `http://localhost:3000/users/verify-email?token=${token}`;
    const mailOptions = {
      from: 'no-reply@example.com',
      to: email,
      subject: 'Email Verification',
      html: `<p>Click the link to verify your email: <a href="${verificationUrl}">Verify Email</a></p>`,
    };

    req.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      }
      console.log('Verification email sent:', info.response);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        message: 'Please verify your email to activate your account',
      });
    });
  })
);

// Login a user and return JWT token and user's cart
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, guestCart } = req.body;

    const user = await User.findOne({ email }).populate('cart.items.product');

    if (user) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        // If guestCart exists, merge it with user's cart
        if (guestCart && guestCart.items && guestCart.items.length > 0) {
          guestCart.items.forEach((item) => {
            user.addToCart(item.product, item.quantity, item.price);
          });
        }
        await user.save();

        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user._id);  // Short-lived token (e.g., 1 hour)
        const refreshToken = generateRefreshToken(user._id);  // Long-lived token (e.g., 7 days)

        // Set cookies for both tokens
        res.cookie('token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
        });

        // Prepare the user cart for response
        const userCart = user.cart.items.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          total: item.quantity * item.product.price,
        }));

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: accessToken,  // Return access token
          cart: {
            items: userCart,
            totalPrice: user.cart.totalPrice,
          },
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  })
);

// Verify email route
router.get(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.query;

    try {
      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      // Mark the user's email as verified
      user.isVerified = true;
      await user.save();

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
  })
);

// Forgot password route (send reset token)
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a reset token
    const resetToken = generateToken(user._id, '15m'); // Token valid for 15 minutes

    // Send reset password email
    const resetUrl = `http://localhost:3000/users/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      html: `<p>Click the link to reset your password: <a href="${resetUrl}">Reset Password</a></p>`,
    };

    req.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send reset email' });
      } else {
        console.log('Reset password email sent:', info.response);
        return res.json({ message: 'Password reset email sent successfully' });
      }
    });
  })
);

// Reset password route (from email link)
router.put(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token } = req.query;
    const { newPassword } = req.body;

    try {
      // Decode the reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      // Hash the new password and save it
      user.password = newPassword;  // Password hashing is done in the user schema pre-save hook
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
  })
);
// Logout route
router.get('/logout', (req, res) => {
  //console.log("Logout route hit!");
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      res.clearCookie('token'); // Adjust to your session cookie name if different
      res.status(200).send('Logged out');
    }
  });
});
// Route to fetch system users (admins, superusers)
router.get('/system-users', asyncHandler(async (req, res) => {
  const systemUsers = await User.find({ role: { $in: ['admin', 'superuser'] } });
  res.json(systemUsers);
}));

// Route to fetch normal users (regular users)
router.get('/normal-users', asyncHandler(async (req, res) => {
  const normalUsers = await User.find({ role: 'user' });
  res.json(normalUsers);
}));
module.exports = router;
