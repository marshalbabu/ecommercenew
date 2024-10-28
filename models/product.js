const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the product schema for furniture
const productSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },  // Name of the product (e.g., "Modern Chair")
  
  description: { 
    type: String, 
    trim: true 
  },  // Detailed description of the product
  
  price: { 
    type: Number, 
    required: true 
  },  // Price of the product
  
  size: { 
    type: String, 
    required: true, 
    trim: true 
  },  // Size (e.g., "40x50x60 cm")
  
  woodType: { 
    type: String, 
    required: true, 
    trim: true 
  },  // Type of wood/material (e.g., "Teak", "Oak")
  
  dateOfMade: { 
    type: Date, 
    required: true 
  },  // Date when the product was made
  
  stock: { 
    type: Number, 
    default: 0 
  },  // Number of items available
  
  category: { 
    type: String, 
    trim: true 
  },  // Category of furniture (e.g., "Chair", "Table")
  
  images: [
    { type: String, trim: true }
  ],  // Array of image URLs (e.g., for photo gallery)
  
  video: { 
    type: String, 
    trim: true 
  },  // URL of the product video
  expirationDate: { type: Date },  // Add expiration date field
  createdAt: { 
    type: Date, 
    default: Date.now 
  }  // Date when the product was added to the catalog
});

// Create and export the Product model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
