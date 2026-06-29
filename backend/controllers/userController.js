const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '24h';
const INVALID_CREDENTIALS_MESSAGE = 'Paire identifiant/mot de passe incorrecte.';

// compare même si l'email existe pas -> même temps de réponse
const DUMMY_HASH = bcrypt.hashSync('constant_time_dummy_password', BCRYPT_SALT_ROUNDS);

exports.signup = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe incorrect / requis.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    return res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe incorrect / requis.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
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
