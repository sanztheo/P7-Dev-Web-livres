const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const userController = require('../controllers/userController');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, réessayez plus tard.' },
});

router.post('/signup', authLimiter, userController.signup);
router.post('/login', authLimiter, userController.login);

module.exports = router;
