// Constantes partagées par l'inscription et la connexion.
const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = '24h';
// Message volontairement identique pour un email inconnu et un mauvais mot de
// passe : on ne révèle jamais si un compte existe (pas d'énumération).
const INVALID_CREDENTIALS_MESSAGE = 'Paire identifiant/mot de passe incorrecte.';

module.exports = {
  BCRYPT_SALT_ROUNDS,
  TOKEN_EXPIRATION,
  INVALID_CREDENTIALS_MESSAGE,
};
