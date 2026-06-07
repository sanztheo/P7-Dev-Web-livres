const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const userCtrl = require('../controllers/user');

// Throttle auth endpoints: blunts password brute-force and limits how often the
// deliberately slow bcrypt comparison can be triggered (a CPU DoS lever).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, réessayez plus tard.' },
});

router.post('/signup', authLimiter, userCtrl.signup);
router.post('/login', authLimiter, userCtrl.login);

module.exports = router;
