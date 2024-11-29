const express = require('express');
const { requestRental, approveRental, getRentals } = require('../controllers/rentalController');
const router = express.Router();

router.post('/request', requestRental); // Request a rental
router.put('/approve/:rentalId', approveRental); // Approve/Deny a rental
router.get('/', getRentals); // Get all rentals

module.exports = router;
