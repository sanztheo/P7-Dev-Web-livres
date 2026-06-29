require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant: définissez-le dans .env avant de démarrer le serveur.');
}

const express = require('express');
const helmet = require('helmet');

const connectDatabase = require('./config/database');
const allowCrossOrigin = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const { IMAGES_DIR } = require('./middleware/uploadImage');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

connectDatabase();

app.use(express.json({ limit: '10kb' }));

app.use(allowCrossOrigin);

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/images', express.static(IMAGES_DIR));

app.use(errorHandler);

module.exports = app;
