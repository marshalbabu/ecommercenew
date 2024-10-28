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
  