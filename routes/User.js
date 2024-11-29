const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const router = express.Router();

router.post('/register', registerUser);  // User Registration
router.post('/login', loginUser);        // User Login

module.exports = router;
