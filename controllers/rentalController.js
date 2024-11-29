const Rental = require('../models/rental');

const requestRental = async (req, res) => {
  const { itemId, renterId, ownerId, rentalPeriod } = req.body;
  try {
    const rental = new Rental({ itemId, renterId, ownerId, rentalPeriod });
    await rental.save();
    res.status(201).json({ message: 'Rental request submitted successfully', rental });
  } catch (error) {
    res.status(400).json({ error: 'Failed to submit rental request' });
  }
};

const approveRental = async (req, res) => {
  const { rentalId } = req.params;
  const { status } = req.body; // 'approved' or 'denied'
  try {
    const rental = await Rental.findByIdAndUpdate(rentalId, { status }, { new: true });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json({ message: 'Rental status updated successfully', rental });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update rental status' });
  }
};

const getRentals = async (req, res) => {
  try {
    const rentals = await Rental.find().populate('itemId renterId ownerId');
    res.json(rentals);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch rentals' });
  }
};

module.exports = { requestRental, approveRental, getRentals };
