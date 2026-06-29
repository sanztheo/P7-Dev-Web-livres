require('dotenv').config();

// On refuse de démarrer si une variable critique manque, plutôt que de planter
// plus tard de façon obscure (JWT_SECRET = signature des jetons, MONGODB_URI =
// adresse de la base).
const REQUIRED_ENV = ['JWT_SECRET', 'MONGODB_URI'];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Variables d'environnement manquantes: ${missing.join(', ')}. Renseignez-les dans .env.`,
  );
}
