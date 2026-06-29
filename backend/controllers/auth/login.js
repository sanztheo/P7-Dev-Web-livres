const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const {
  BCRYPT_SALT_ROUNDS,
  TOKEN_EXPIRATION,
  INVALID_CREDENTIALS_MESSAGE,
} = require('./constants');

// Hash "leurre" comparé quand l'email n'existe pas : on garde un temps de
// réponse constant pour ne pas trahir l'existence d'un compte (timing attack).
const DUMMY_HASH = bcrypt.hashSync('constant_time_dummy_password', BCRYPT_SALT_ROUNDS);

// email et password sont déjà validés par le middleware validateLogin.
module.exports = async (req, res, next) => {
  const { email, password } = req.body;

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

    return res.status(200).json({ userId: user._id, token });
  } catch (error) {
    return next(error);
  }
};
