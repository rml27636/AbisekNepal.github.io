const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  location: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  pricePer: { type: String, enum: ['Per Day', 'Per Hour', 'Per Month'], required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['onSale', 'sold'], default: 'onSale' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', ItemSchema);
