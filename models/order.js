const mongoose = require('mongoose');
const addressSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
});
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  shippingAddress: addressSchema,  // Embedded schema for shipping
  billingAddress: addressSchema,   // Embedded schema for billing
  paymentMethod: {
    type: String,
    required: true,  // E.g., "Credit Card", "PayPal", "Cash on Delivery"
  },
  paymentResult: {
    id: { type: String },  // Payment ID (e.g., from PayPal or Stripe)
    status: { type: String },  // Payment status
    update_time: { type: String },  // Time of payment update
    email_address: { type: String },  // Payer's email address
  },
  totalPrice: {
    type: Number,
    required: true,  // Final price including all calculations
  },
  tax: {
    type: Number,
    required: true,  // Tax amount
  },
  shippingFee: {
    type: Number,
    required: true,  // Shipping fee
  },
  discount: {
    type: Number,  // Discount applied (optional)
    default: 0,
  },
  isPaid: {
    type: Boolean,
    default: false,  // Flag to indicate if the order has been paid
  },
  paidAt: {
    type: Date,  // Timestamp when the order was paid
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'],
  },
  isShipped: {
    type: Boolean,
    default: false,
  },
  isDelivered: {
    type: Boolean,
    default: false,  // Flag to indicate if the order has been delivered
  },
  shippedAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,  // Timestamp for delivery
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Order creation timestamp
  },
});

// Export the Order model
module.exports = mongoose.model('Order', orderSchema);
