const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');

// Public auth routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected auth route
router.get('/me', protect, getMe);

module.exports = router;
