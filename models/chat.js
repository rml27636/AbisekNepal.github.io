const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  roomId: { type: String, required: true },  // Room ID (unique to renter-owner pair)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],  // Owner and Renter IDs
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Sender's user ID
  message: { type: String, required: true },  // The chat message
  createdAt: { type: Date, default: Date.now },  // Timestamp
});

module.exports = mongoose.model('Chat', ChatSchema);
