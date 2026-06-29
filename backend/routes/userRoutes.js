const express = require('express');
const router = express.Router();

const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateSignup,
  validateLogin,
} = require('../middleware/validation/userValidation');
const userController = require('../controllers/userController');

router.post('/signup', authLimiter, validateSignup, userController.signup);
router.post('/login', authLimiter, validateLogin, userController.login);

module.exports = router;
