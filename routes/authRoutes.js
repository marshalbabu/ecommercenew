const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Assume refreshToken is stored in cookies

  if (!refreshToken) {
    return res.status(401).json({ message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.cookie('token', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Token refreshed' });
  } catch (error) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;
