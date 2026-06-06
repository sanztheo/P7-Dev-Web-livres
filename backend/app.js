require('dotenv').config();

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

app.use(express.json());

// CORS is handled manually (no proxy in front) so the React dev server on a
// different origin can call this API.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

module.exports = app;
