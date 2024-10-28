const express = require('express');
const multer = require('multer');
const Joi = require('joi');
const Product = require('../models/product');
const asyncHandler = require('express-async-handler');
const { protect, admin, protectAndVerify } = require('../Middleware/authMiddleware');  // Import JWT, admin, and verified email middleware
const router = express.Router();

// Configure multer for local image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Filename with timestamp
  },
});

const upload = multer({ storage });

// Joi Validation Schema for Product
const productValidationSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().optional(),
  price: Joi.number().required(),
  size: Joi.string().trim().required(),
  woodType: Joi.string().trim().required(),
  dateOfMade: Joi.date().required(),
  stock: Joi.number().default(0),
  category: Joi.string().trim().optional(),
  images: Joi.array().items(Joi.string().trim()).optional(),
  video: Joi.string().trim().optional(),
});

// Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  if (err.isJoi) {
    return res.status(400).json({ error: err.details[0].message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
}

// POST route to add a new product (Protected, Admin Only, Verified Email)
router.post(
  '/',
  protect,  // Ensure the user is logged in
  protectAndVerify, // Ensure email is verified
  admin,    // Ensure the user is an admin
  asyncHandler(async (req, res, next) => {
    const { error, value } = productValidationSchema.validate(req.body);
    if (error) {
      throw error;
    }

    const newProduct = new Product(value);
    await newProduct.save();
    res.status(201).json(newProduct);
  })
);

// PUT route to update a product by ID (Protected, Admin Only, Verified Email)
router.put(
  '/:id',
  protect,  // Ensure the user is logged in
  protectAndVerify, // Ensure email is verified
  admin,    // Ensure the user is an admin
  asyncHandler(async (req, res, next) => {
    const { error, value } = productValidationSchema.validate(req.body);
    if (error) {
      throw error;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(updatedProduct);
  })
);

// GET all products (Public, No protection needed)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await Product.find();
    res.json(products);
  })
);

// 1. Filter products by category (Public, No protection needed)
router.get(
  '/category/:category',
  asyncHandler(async (req, res) => {
    const products = await Product.find({ category: req.params.category });
    if (!products.length) {
      return res.status(404).json({ message: 'No products found in this category' });
    }
    res.json(products);
  })
);

// 2. Sort products by price and date (Public, No protection needed)
router.get(
  '/sort',
  asyncHandler(async (req, res) => {
    const { sortBy = 'createdAt', order = 'desc' } = req.query;
    const products = await Product.find().sort({ [sortBy]: order === 'desc' ? -1 : 1 });
    res.json(products);
  })
);

// 3. Upload and manage product images with local storage (Protected, Admin Only, Verified Email)
router.post(
  '/:id/upload',
  protect,  // Ensure the user is logged in
  protectAndVerify, // Ensure email is verified
  admin,    // Ensure the user is an admin
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add uploaded image path to the product's images array
    product.images.push(req.file.path);
    await product.save();
    res.json(product);
  })
);

// 4. Fetch recently added products (Public, No protection needed)
router.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 }).limit(10);
    res.json(products);
  })
);

// 5. Bulk delete products by ID (Protected, Admin Only, Verified Email)
router.delete(
  '/bulk-delete',
  protect,  // Ensure the user is logged in
  protectAndVerify, // Ensure email is verified
  admin,    // Ensure the user is an admin
  asyncHandler(async (req, res) => {
    const { productIds } = req.body;
    const result = await Product.deleteMany({ _id: { $in: productIds } });
    res.json({ message: `${result.deletedCount} products deleted successfully` });
  })
);

// 6. Enhanced search products by multiple fields (name, category, price range, woodType, size, etc.) (Public)
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { name, category, minPrice, maxPrice, woodType, size } = req.query;
    let query = {};

    // Full-text search on name and description
    if (name) {
      query.$text = { $search: name }; // MongoDB text index
    }
    if (category) {
      query.category = category;
    }
    if (woodType) {
      query.woodType = woodType;
    }
    if (size) {
      query.size = size;
    }
    if (minPrice) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    const products = await Product.find(query);
    res.json(products);
  })
);

// GET a single product by ID (Public, No protection needed)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  })
);

// DELETE a product by ID (Protected, Admin Only, Verified Email)
router.delete(
  '/:id',
  protect,  // Ensure the user is logged in
  protectAndVerify, // Ensure email is verified
  admin,    // Ensure the user is an admin
  asyncHandler(async (req, res) => {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  })
);

// Get products with improved pagination (Public, No protection needed)
router.get(
  '/paginate',
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Parse query params
    const skip = (page - 1) * limit;

    // Fetch products with pagination
    const products = await Product.find()
      .skip(skip)
      .limit(Number(limit))
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

    // Count total number of products
    const totalProducts = await Product.countDocuments();

    res.json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      hasNextPage: page * limit < totalProducts,
      hasPrevPage: page > 1,
      totalProducts,
    });
  })
);

// Centralized error handler should be the last middleware
router.use(errorHandler);

module.exports = router;
