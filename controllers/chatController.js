const Chat = require('../models/chat');

// Fetch chat history for a specific room (item or user)
const getChatHistory = async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatHistory = await Chat.find({ roomId }).populate('senderId', 'name');
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = { getChatHistory };
