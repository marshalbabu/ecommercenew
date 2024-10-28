const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },  // User who wrote the review
  
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },  // Product being reviewed
  
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },  // Rating between 1-5
  
  comment: { 
    type: String, 
    required: true 
  },  // Textual comment
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },  // Review creation date
  
  // Optional: Track review status for moderation
  status: { 
    type: String, 
    enum: ['approved', 'pending', 'rejected'], 
    default: 'pending' 
  },  // Review moderation status

  // Optional: Track if the user was verified when posting the review
  isUserVerified: { 
    type: Boolean, 
    default: false 
  },  // Whether the user who posted the review was verified
  
}, { 
  // Optionally enforce unique reviews for each product-user pair
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

// Enforce unique reviews per product-user pair (optional)
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
