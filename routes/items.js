const express = require('express');
const { createItem, getItems, getRecommendations } = require('../controllers/itemController');
const router = express.Router();

// POST route to add a new item
router.post('/add', createItem);  // Now the controller handles the response

// GET route to fetch all items
router.get('/', getItems);

// GET route to fetch recommended items
router.get('/recommend', getRecommendations);  // Get recommended items

module.exports = router;
