const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const {
  BCRYPT_SALT_ROUNDS,
  TOKEN_EXPIRATION,
  INVALID_CREDENTIALS_MESSAGE,
} = require('./constants');

// faux hash qu'on compare quand l'email existe pas, pour pas trahir son existence via le temps de réponse
const DUMMY_HASH = bcrypt.hashSync('constant_time_dummy_password', BCRYPT_SALT_ROUNDS);

// email et password sont déjà validés par le middleware validateLogin.
module.exports = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    // on cherche le compte par email
    if (!user) {
      // email inconnu, mais on compare quand même avec le faux hash pour garder le même délai
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    // bcrypt retrouve le sel planqué dans user.password et compare les deux hash
    if (!isPasswordValid) {
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });
    }

    // mot de passe bon, on fabrique le token signé avec la clé secrète, valable 24h
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION,
    });

    return res.status(200).json({ userId: user._id, token });
  } catch (error) {
    return next(error);
  }
};
