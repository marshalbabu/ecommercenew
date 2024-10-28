const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Cart item schema to store product and quantity
const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
});

// User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Define the roles
    default: 'user', // Set default role to 'user'
  },
    isVerified: { 
    type: Boolean, 
    default: false 
  },  // Email verification flag
  isAdmin: {
    type: Boolean,
    default: false,  // Regular users are not admins
  },
  verificationToken: { 
    type: String, 
  },  // Email verification token (optional)
  resetPasswordToken: { 
    type: String, 
  },  // Password reset token (optional)
  resetPasswordExpire: { 
    type: Date, 
  },  // Token expiration time (optional)
  lastLogin: { 
    type: Date 
  },  // Optional: To track last login
  cart: {
    items: [cartItemSchema],  // Cart items for storing user cart products
    totalPrice: { type: Number, default: 0 },
  },  // Cart field for storing user cart items
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);  // Hash the password
  next();
});

// Method to compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to generate email verification token
userSchema.methods.generateVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString('hex');  // Create token
  this.verificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');  // Hash it
  return verificationToken;  // Return un-hashed token for sending in email
};

// Method to generate password reset token
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');  // Create token
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');  // Hash it
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;  // Set token expiration time (10 minutes)
  return resetToken;  // Return un-hashed token for sending in email
};

// Method to add a product to the user's cart
userSchema.methods.addToCart = function (productId, quantity, price) {
  const existingItemIndex = this.cart.items.findIndex((item) => item.product.equals(productId));

  if (existingItemIndex >= 0) {
    // If product already in cart, update the quantity
    this.cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Else, add new product to the cart
    this.cart.items.push({ product: productId, quantity });
  }

  // Update total price
  this.cart.totalPrice += price * quantity;

  return this.save();  // Save the user with updated cart
};

// Method to remove a product from the cart
userSchema.methods.removeFromCart = function (productId, price) {
  const itemIndex = this.cart.items.findIndex((item) => item.product.equals(productId));

  if (itemIndex >= 0) {
    const item = this.cart.items[itemIndex];

    // Deduct the item's price from totalPrice
    this.cart.totalPrice -= item.quantity * price;

    // Remove item from cart
    this.cart.items.splice(itemIndex, 1);
  }

  return this.save();  // Save the user with updated cart
};

// Method to clear cart after checkout or migration
userSchema.methods.clearCart = function () {
  this.cart.items = [];
  this.cart.totalPrice = 0;
  return this.save();  // Save the user after clearing the cart
};

// Method to migrate guest cart to user cart
userSchema.methods.migrateGuestCart = function (guestCart) {
  guestCart.items.forEach((guestItem) => {
    const existingItemIndex = this.cart.items.findIndex((item) => item.product.equals(guestItem.product));

    if (existingItemIndex >= 0) {
      // If the product exists in the user's cart, update the quantity
      this.cart.items[existingItemIndex].quantity += guestItem.quantity;
    } else {
      // Otherwise, add the guest cart item to the user's cart
      this.cart.items.push(guestItem);
    }
  });

  // Update the total price with the guest cart
  this.cart.totalPrice += guestCart.totalPrice;

  return this.save();  // Save the updated user cart
};

// Export the User model
module.exports = mongoose.model('User', userSchema);
