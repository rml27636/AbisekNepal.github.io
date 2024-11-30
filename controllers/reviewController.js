const Review = require('../models/review');
const Item = require('../models/items');
const mongoose = require('mongoose');

const createReview = async (req, res) => {
  const { userId, itemId, rating, comment } = req.body;

  try {
    // Check if the item exists
    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Create a new review
    const review = new Review({
      userId,
      itemId,
      rating,
      comment,
    });

    // Save the review to the database
    await review.save();

    // Send response
    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to submit review' });
  }
};

const getReviewsByItem = async (req, res) => {
  const { itemId } = req.params;

  try {
    // Fetch reviews for the given item ID, sorted by the latest
    const reviews = await Review.find({ itemId })
      .populate('userId', 'name')
      .populate('itemId', 'name')
      .sort({ createdAt: -1 }); // Sorting by the latest reviews

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this item' });
    }

    // Send reviews as the response
    res.json({ reviews });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to fetch reviews' });
  }
};


module.exports = { createReview, getReviewsByItem };
