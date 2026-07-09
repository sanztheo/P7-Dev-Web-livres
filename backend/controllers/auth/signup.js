const bcrypt = require('bcrypt');
const User = require('../../models/User');
const { BCRYPT_SALT_ROUNDS } = require('./constants');

// email et password sont déjà validés par le middleware validateSignup.
module.exports = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // on ne stocke jamais le mot de passe en clair : bcrypt le hache
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    // si l'email existe déjà, ça plante ici (index unique) et part dans le catch
    return res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (error) {
    return next(error);
  }
};
