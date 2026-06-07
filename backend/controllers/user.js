const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Cost factor for bcrypt: 10 rounds is the project standard, balancing
// brute-force resistance against per-request hashing latency.
const BCRYPT_SALT_ROUNDS = 10;

// JWT lifetime kept short-lived so a leaked token expires within a day.
const TOKEN_EXPIRATION = '24h';

// Single generic message for any login failure so an attacker cannot tell
// whether the email exists (prevents user enumeration).
const INVALID_CREDENTIALS_MESSAGE = 'Paire identifiant/mot de passe incorrecte.';

// Pre-computed hash compared against when the email is unknown, so a failed login
// costs about the same time whether or not the account exists (defeats the timing
// side-channel that would otherwise let an attacker enumerate emails).
const DUMMY_HASH = bcrypt.hashSync('constant_time_dummy_password', BCRYPT_SALT_ROUNDS);

exports.signup = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    // Never persist the plaintext password; only the bcrypt hash is stored.
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    return res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    // Forward to the central handler for a generic message: never echo the raw
    // Mongoose error — it would leak the submitted email and reveal that an account
    // already exists (an account-enumeration vector).
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Run a bcrypt compare against a dummy hash anyway so this branch costs about
      // the same as a real check — hides whether the email exists.
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
    });

    return res.status(200).json({
      userId: user._id,
      token,
    });
  } catch (error) {
    return next(error);
  }
};
