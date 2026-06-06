const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { upload, optimizeImage } = require('../middleware/multer-config');
const booksCtrl = require('../controllers/book');

// Public reads.
router.get('/', booksCtrl.getAllBooks);

// '/bestrating' MUST be declared before '/:id'. Express matches routes top-down,
// so a generic '/:id' placed first would capture "bestrating" as an id param and
// never let this handler run.
router.get('/bestrating', booksCtrl.getBestRating);

router.get('/:id', booksCtrl.getOneBook);

// Mutations require a valid JWT (auth). Create/modify accept multipart uploads,
// so multer parses the form then sharp optimizes the buffer before the controller.
router.post('/', auth, upload, optimizeImage, booksCtrl.createBook);
router.put('/:id', auth, upload, optimizeImage, booksCtrl.modifyBook);
router.delete('/:id', auth, booksCtrl.deleteBook);
router.post('/:id/rating', auth, booksCtrl.createRating);

module.exports = router;
