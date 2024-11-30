const express = require('express');
const { getChatHistory, saveChatMessageHandler } = require('../controllers/chatController');
const router = express.Router();

// Get chat history for a specific room
router.get('/:roomId', getChatHistory);

// Save a new chat message
router.post('/message', saveChatMessageHandler);

module.exports = router;
