const { body } = require('express-validator');
const handleValidationErrors = require('./handleValidationErrors');

// Règles de robustesse du mot de passe à l'inscription : au moins 8 caractères,
// une majuscule et un chiffre. minSymbols à 0 = les caractères spéciaux ne sont
// pas obligatoires.
const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 0,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
};

// Inscription : on vérifie le format de l'email et la force du mot de passe.
// normalizeEmail met l'adresse en minuscules et la nettoie pour éviter les
// doublons (on garde les points des adresses Gmail, sinon le comportement
// surprend l'utilisateur).
const validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isStrongPassword(PASSWORD_RULES)
    .withMessage(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.',
    ),
  handleValidationErrors,
];

// Connexion : on ne réimpose pas les règles de force (un ancien compte pourrait
// ne pas les respecter), on vérifie seulement que les champs sont présents et
// que l'email est normalisé comme à l'inscription pour que la recherche colle.
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Adresse email invalide.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
  handleValidationErrors,
];

module.exports = { validateSignup, validateLogin };
