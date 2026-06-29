const express = require('express');
const router = express.Router();

const { authLimiter } = require('../middleware/rateLimiter');
const {
  validateSignup,
  validateLogin,
} = require('../validation/userValidation');
const signup = require('../controllers/auth/signup');
const login = require('../controllers/auth/login');

// chaque route : limite de débit -> validation des entrées -> contrôleur
router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login', authLimiter, validateLogin, login);

module.exports = router;
