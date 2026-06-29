const rateLimit = require('express-rate-limit');

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const MAX_AUTH_ATTEMPTS = 20;

// Limite les tentatives sur les routes d'authentification pour freiner les
// attaques par force brute (essais de mots de passe en masse).
const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  max: MAX_AUTH_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives, réessayez plus tard.' },
});

module.exports = { authLimiter };
