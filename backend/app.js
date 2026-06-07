require('dotenv').config();

// Fail fast: the server signs and verifies every JWT with this secret, so refuse
// to boot without it instead of failing only on the first request with a 500.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant: définissez-le dans .env avant de démarrer le serveur.');
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/books');

const app = express();

// Persist uploaded images on disk; gitignored at runtime so the dir may not exist yet.
const IMAGES_DIR = path.join(__dirname, 'images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Connect once at startup; the app still boots if Mongo is unreachable so the
// failure surfaces in logs rather than crashing silently.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connection successful'))
  .catch((error) => console.error('MongoDB connection failed:', error));

// Bound the JSON body size: book payloads are tiny (image bytes go through multer),
// so a small cap blunts oversized-payload abuse.
app.use(express.json({ limit: '10kb' }));

// CORS is handled manually (no proxy in front) so the React dev server on a
// different origin can call this API.
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
  // Short-circuit preflight so it never reaches auth-protected handlers.
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

// Served as absolute URLs (imageUrl) so the browser can load covers directly.
app.use('/images', express.static(IMAGES_DIR));

// Centralised error handler (must be last): keeps stack traces and Mongoose/Multer
// internals off the wire and maps known failures to coherent status codes. Controllers
// forward unexpected errors here via .catch(next).
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
