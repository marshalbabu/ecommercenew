// models/cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Linked product
      quantity: { type: Number, required: true, default: 1 }, // Quantity of the product
    },
  ],
  totalPrice: { type: Number, required: true, default: 0 }, // Total price of all items
  updatedAt: { type: Date, default: Date.now }, // Last updated time
});

module.exports = mongoose.model('Cart', cartSchema);
