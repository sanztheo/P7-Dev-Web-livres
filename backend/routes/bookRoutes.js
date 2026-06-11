const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { upload, optimizeImage } = require('../middleware/uploadImage');
const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);

// avant /:id sinon "bestrating" est pris pour un id
router.get('/bestrating', bookController.getBestRating);

router.get('/:id', bookController.getOneBook);

router.post('/', authenticate, upload, optimizeImage, bookController.createBook);
router.put('/:id', authenticate, upload, optimizeImage, bookController.modifyBook);
router.delete('/:id', authenticate, bookController.deleteBook);
router.post('/:id/rating', authenticate, bookController.createRating);

module.exports = router;
