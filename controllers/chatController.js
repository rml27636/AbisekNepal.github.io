const Chat = require('../models/chat');

/**
 * Fetch chat history for a specific room (with pagination)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChatHistory = async (req, res) => {
  const loggedInUserId = req.cookies.userId; // Assuming you're attaching the logged-in user's ID to `req.user`

  try {
    const chatHistory = await Chat.find({ participants: loggedInUserId })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 }); // Oldest messages first
    
    res.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};



/**
 * Save a new chat message to the database
 * @param {string} roomId - Room ID (e.g., itemId or userId)
 * @param {string} senderId - Sender's user ID
 * @param {string} message - The chat message
 */
// Refactored saveChatMessage to accept parameters instead of req and res
const saveChatMessage = async (roomId, senderId, message, participants) => {
  try {
    console.log("Received data:", { roomId, senderId, message, participants });

    if (typeof roomId !== 'string' || roomId.trim() === '' || !senderId || !message || !participants) {
      throw new Error('All fields (roomId, senderId, message, participants) are required');
    }

    // Create the new chat message object
    const chatMessage = new Chat({
      roomId,
      senderId,
      message,
      participants,
      timestamp: new Date(),  // Add timestamp to the message
    });

    // Save the chat message
    await chatMessage.save();
    return chatMessage;  // Return the saved message object
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw new Error('Failed to save chat message');
  }
};

// Express handler function to call saveChatMessage
const saveChatMessageHandler = async (req, res) => {
  const { roomId, senderId, message, participants } = req.body;

  try {
    // Call saveChatMessage with data from the request body
    const savedMessage = await saveChatMessage(roomId, senderId, message, participants);
    res.status(201).json(savedMessage);  // Return the saved message as the response
  } catch (error) {
    console.error('Error in saveChatMessageHandler:', error);
    res.status(500).json({ error: error.message || 'Failed to save chat message' });
  }
};

module.exports = { getChatHistory, saveChatMessage, saveChatMessageHandler };
