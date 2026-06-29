require('./config/env');

const express = require('express');
const helmet = require('helmet');

const connectDatabase = require('./config/database');
const { IMAGES_DIR } = require('./config/paths');
const allowCrossOrigin = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
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
