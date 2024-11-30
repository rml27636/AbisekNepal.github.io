const mongoose = require('mongoose');
const Rental = require('../models/rental');

// Submit a new rental request
const requestRental = async (req, res) => {
  const { itemId, ownerId, rentalPeriod, message } = req.body;
  const renterId = req.cookies.userId;

  if (!renterId) {
    return res.status(401).json({ error: 'User not logged in' });
  }

  // Validate input fields
  if (!itemId || !ownerId || !rentalPeriod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(itemId) ||
    !mongoose.Types.ObjectId.isValid(ownerId) ||
    !mongoose.Types.ObjectId.isValid(renterId)
  ) {
    return res.status(400).json({ error: 'Invalid ObjectId provided' });
  }

  try {
    // Create and save the rental request
    const rental = new Rental({
      itemId,
      renterId,
      ownerId,
      rentalPeriod,
      message: message || '',
      status: 'requested',
    });

    await rental.save();

    // Populate item, renter, and owner details
    const populatedRental = await Rental.findById(rental._id).populate('itemId renterId ownerId');

    res.status(201).json({ message: 'Rental request submitted successfully', rental: populatedRental });
  } catch (error) {
    console.error('Error in rental request:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to submit rental request' });
  }
};

// Approve or deny a rental request
const approveRental = async (req, res) => {
  const { id } = req.params; // Rental request ID
  const { status } = req.body; // Status: 'approved' or 'denied'

  // Validate status
  if (!['approved', 'denied'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "denied".' });
  }

  try {
    // Update rental request status
    const rental = await Rental.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!rental) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    res.json({ message: 'Rental status updated successfully', rental });
  } catch (error) {
    console.error('Error updating rental status:', error);
    res.status(500).json({ error: 'Failed to update rental status' });
  }
};

// Get rental requests for a user
const getUserRentalRequests = async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not logged in' });
    }

    const rentalRequests = await Rental.find({ ownerId: userId }).populate('itemId renterId');
    res.status(200).json(rentalRequests);
  } catch (error) {
    console.error('Error fetching rental requests:', error);
    res.status(500).json({ error: 'Error fetching rental requests' });
  }
};

// Get all rentals
const getRentals = async (req, res) => {
  try {
    const rentals = await Rental.find().populate('itemId renterId ownerId');
    res.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
};

// Update the status of a specific rental request
const updateRentalRequestStatus = async (req, res) => {
  const { id } = req.params; // Rental request ID
  console.log('Request ID:', id);
  const { status } = req.body; // Status: 'approved' or 'declined'

  // Validate status
  if (!['approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "declined".' });
  }

  // Validate the rental request ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ObjectId for rental request' });
  }

  try {
    // Update rental status
    const rentalRequest = await Rental.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!rentalRequest) {
      return res.status(404).json({ error: 'Rental request not found' });
    }

    res.status(200).json({ message: `Request marked as ${status}`, rentalRequest });
  } catch (error) {
    console.error('Error updating rental request:', error);
    res.status(500).json({ error: 'Error updating rental request' });
  }
};

module.exports = {
  requestRental,
  approveRental,
  getRentals,
  getUserRentalRequests,
  updateRentalRequestStatus,
};
