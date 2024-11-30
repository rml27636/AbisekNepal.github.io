const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['requested', 'approved', 'denied'], default: 'requested' },
  rentalPeriod: { type: Number, required: true }, // e.g., in days
  message: {type: String, default: ''},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Rental', RentalSchema);
