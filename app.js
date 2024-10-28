require('dotenv').config(); // Loads environment variables from .env file
const express = require('express');
const app = express();
const cors = require('cors'); // Import CORS
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminDashboardRoutes = require('./routes/admindashboardRoutes');
const nodemailer = require('nodemailer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cartRoutes = require('./routes/cartRoutes');
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, { /* options */ });
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes'); // Import the route

// Use CORS to allow requests from frontend
app.use(cors({
  origin: 'http://localhost:3001', // Adjust for your frontend
  credentials: true, // Allow cookies and other credentials
}));

// Middleware to parse JSON
app.use(express.json());

// Configure session middleware with MongoStore and cookie expiration
app.use(
  session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/furniture_store' }),
    cookie: {
      httpOnly: true,
      //maxAge: 24 * 60 * 60 * 1000,  // 1-day expiration
      secure: process.env.NODE_ENV === 'production',  // Secure in production
    },
    rolling: true,  // Reset cookie expiration on each request
  })
);


mongoose.connect('mongodb://localhost:27017/furniture_store')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure Ethereal email using environment variables
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER || 'your_ethereal_user',
    pass: process.env.ETHEREAL_PASS || 'your_ethereal_password',
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error setting up email transporter:', error);
  } else {
    console.log('Ethereal test account ready for sending emails.');
  }
});

app.use((req, res, next) => {
  req.transporter = transporter;
  next();
});
app.use(cookieParser());
// Register routes
app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/reviews', reviewRoutes);
app.use('/cart', cartRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);
app.use('/auth', authRoutes); // Use the route


// Socket.io integration
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
