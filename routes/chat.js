const express = require('express');
const { getChatHistory } = require('../controllers/chatController');
const router = express.Router();

// Get chat history for a specific room
router.get('/:roomId', getChatHistory);

module.exports = router;
