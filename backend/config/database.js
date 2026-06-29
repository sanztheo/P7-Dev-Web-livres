const mongoose = require('mongoose');

// Ouvre la connexion à MongoDB au démarrage. On garde la connexion isolée ici
// pour qu'app.js ne fasse qu'assembler l'application.
const connectDatabase = () =>
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connexion MongoDB OK'))
    .catch((error) => console.error('Connexion MongoDB échouée :', error));

module.exports = connectDatabase;
