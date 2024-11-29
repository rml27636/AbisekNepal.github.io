const express = require('express');
const { createReview, getReviewsByItem } = require('../controllers/reviewController');
const router = express.Router();

// Route to submit a review
router.post('/submit', createReview);

// Route to get reviews for a specific item
router.get('/:itemId', getReviewsByItem);

module.exports = router;
