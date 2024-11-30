const express = require('express');
const { getChatHistory } = require('../controllers/chatController');
const router = express.Router();
const { saveChatMessage } = require('../controllers/chatController');

// Get chat history for a specific room
router.get('/:roomId', getChatHistory);

// POST route to save a new chat message
router.post('/message', async (req, res) => {
  const { roomId, senderId, message } = req.body;

  try {
    const savedMessage = await saveChatMessage(roomId, senderId, message);
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

module.exports = router;
