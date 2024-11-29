const mongoose = require('mongoose')
const Item = require('../models/items');

const createItem = async (req, res) => {
  try {
    console.log('Cookies:', req.cookies);
    // Retrieve ownerId from cookies
    const ownerId = req.cookies.userId;
    if (!ownerId) {
      return res.status(401).json({ error: 'User is not logged in' });
    }

    // Extract other fields from the request body
    const { name, age, location, description, price, pricePer } = req.body;

    // Log the incoming request body and ownerId to check for missing data
    console.log('Received item data:', req.body);
    console.log('Owner ID from cookie:', ownerId);

    // Validate that all required fields are present
    if (!name || !age || !location || !price || !pricePer) {
      return res.status(400).json({ error: 'Missing required fields: name, age, location, price, pricePer' });
    }

    // Validate that the ownerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: 'Invalid owner ID' });
    }

    // Create a new item object
    const item = new Item({
      name,
      age,
      location,
      description,
      price,
      pricePer,
      ownerId, // Use the ownerId from the cookie
    });

    // Save the item to the database
    await item.save();
    // Respond with the created item
      res.status(201).json({
      message: 'Item added successfully',
      item: item, // Return the created item in the response
    });
  } catch (error) {
    console.error('Error while adding item:', error); // Log the error for debugging
    res.status(500).json({ error: 'Failed to add item. Please try again later.' });
  }
};


const getItems = async (req, res) => {
  try {
    // Retrieve ownerId from cookies to filter by the current user
    const ownerId = req.cookies.userId;

    if (!ownerId) {
      return res.status(401).json({ error: 'User is not logged in' });
    }

    // Fetch items belonging to the logged-in user (ownerId)
    const items = await Item.find({ ownerId });

    if (items.length === 0) {
      return res.status(404).json({ message: 'No items found for this user' });
    }

    res.json(items); // Send back the user's items
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items. Please try again later.' });
  }
};

const getRecommendations = async (req, res) => {
  const { tags } = req.query;

  try {
    const recommendations = await Item.find({ tags: { $in: tags } }).limit(10);
    res.json(recommendations);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch recommendations' });
  }
};
module.exports = { createItem, getItems, getRecommendations };
