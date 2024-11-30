const express = require('express');
const {
  requestRental,
  approveRental,
  getRentals,
  getUserRentalRequests,
  updateRentalRequestStatus,
} = require('../controllers/rentalController');  // Correct import
const router = express.Router();

// Existing routes
router.post('/request', requestRental); // Request a rental
router.put('/rental-requests/:id/approve', approveRental); // Approve/Deny a rental
router.get('/', getRentals); // Get all rentals

// New routes
router.get('/rental-requests', getUserRentalRequests); // Get rental requests for logged-in user
router.put('/rental-requests/:id', updateRentalRequestStatus); // Update rental request status

module.exports = router;
