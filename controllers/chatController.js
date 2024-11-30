const Chat = require('../models/chat');

// Fetch chat history for a specific room (item or user)
const getChatHistory = async (req, res) => {
  const { roomId } = req.params;

  try {
    const chatHistory = await Chat.find({ roomId }).populate('senderId', 'name');
    res.json(chatHistory); // Return chat history
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Save a new chat message to the database
const saveChatMessage = async (roomId, senderId, message) => {
  try {
    const chatMessage = new Chat({ roomId, senderId, message });
    await chatMessage.save();
    return chatMessage;
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw new Error('Failed to save chat message');
  }
};

module.exports = { getChatHistory, saveChatMessage };
