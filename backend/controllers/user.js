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

exports.signup = async (req, res) => {
  try {
    // Never persist the plaintext password; only the bcrypt hash is stored.
    const hashedPassword = await bcrypt.hash(req.body.password, BCRYPT_SALT_ROUNDS);
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
    });
    await user.save();
    return res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    // Includes mongoose-unique-validator failures (duplicate email).
    return res.status(400).json({ error });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Same response as a wrong password to avoid leaking which emails exist.
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
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
    return res.status(500).json({ error });
  }
};
