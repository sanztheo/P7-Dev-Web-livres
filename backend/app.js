require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant: définissez-le dans .env avant de démarrer le serveur.');
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

const IMAGES_DIR = path.join(__dirname, 'images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion MongoDB OK'))
  .catch((error) => console.error('Connexion MongoDB échouée :', error));

app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/images', express.static(IMAGES_DIR));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);

  const clientErrorNames = ['ValidationError', 'CastError', 'MulterError'];
  let status = err.status || err.statusCode;
  if (!status) {
    status =
      clientErrorNames.includes(err.name) || err.type === 'entity.parse.failed'
        ? 400
        : 500;
  }

  const message =
    err.name === 'MulterError'
      ? 'Fichier invalide ou trop volumineux.'
      : status === 413
        ? 'Charge trop volumineuse.'
        : status >= 500
          ? 'Erreur serveur.'
          : 'Requête invalide.';

  return res.status(status).json({ message });
});

module.exports = app;
