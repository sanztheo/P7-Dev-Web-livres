const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload/multerConfig');
const optimizeImage = require('../middleware/upload/optimizeImage');
const createBook = require('../controllers/books/createBook');
const getAllBooks = require('../controllers/books/getAllBooks');
const getOneBook = require('../controllers/books/getOneBook');
const getBestRating = require('../controllers/books/getBestRating');
const modifyBook = require('../controllers/books/modifyBook');
const deleteBook = require('../controllers/books/deleteBook');
const ratingController = require('../controllers/ratingController');

router.get('/', getAllBooks);

// avant /:id sinon "bestrating" est pris pour un id
router.get('/bestrating', getBestRating);

router.get('/:id', getOneBook);

router.post('/', authenticate, upload, optimizeImage, createBook);
router.put('/:id', authenticate, upload, optimizeImage, modifyBook);
router.delete('/:id', authenticate, deleteBook);
router.post('/:id/rating', authenticate, ratingController.createRating);

module.exports = router;
