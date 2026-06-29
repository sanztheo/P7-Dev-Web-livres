const express = require('express');
const router = express.Router();

const { authLimiter } = require('../middleware/rateLimiter');
const userController = require('../controllers/userController');

router.post('/signup', authLimiter, userController.signup);
router.post('/login', authLimiter, userController.login);

module.exports = router;
