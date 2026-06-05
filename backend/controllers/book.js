const fs = require('fs');
const Book = require('../models/Book');

// Mongoose rejects schema validation if averageRating carries more precision than
// the frontend renders, so we normalise every computed average to two decimals.
const round2 = (value) => Math.round(value * 100) / 100;

// averageRating is derived state, never trusted from the client: recompute it
// from the authoritative ratings array every time it changes (0 when empty).
const computeAverage = (ratings) => {
  if (ratings.length === 0) {
    return 0;
  }
  const total = ratings.reduce((sum, { grade }) => sum + grade, 0);
  return round2(total / ratings.length);
};

// imageUrl is stored as an absolute URL so the browser can load it directly;
// to delete the backing file we need only its name (the last path segment).
const filenameFromImageUrl = (imageUrl) => imageUrl.split('/images/')[1];

// optimizeImage writes the .webp to disk before the controller runs any DB
// check, so every mutation error path that carried a file must delete that
// just-written file or it leaks on disk with no document referencing it.
const cleanupUploadedFile = (req) => {
  if (req.file) {
    fs.unlink(`images/${req.file.filename}`, () => {});
  }
};

exports.createBook = (req, res, next) => {
  // A book without its cover can never be created, and a malformed book JSON
  // would throw synchronously: reject both as 400 before constructing the Book.
  if (!req.file) {
    return res.status(400).json({ message: 'Image requise.' });
  }

  let bookObject;
  try {
    bookObject = JSON.parse(req.body.book);
  } catch (error) {
    cleanupUploadedFile(req);
    return res.status(400).json({ message: 'Données du livre invalides.' });
  }

  // The client must never dictate ownership or the document id: strip both and
  // pin userId to the authenticated user so a book can't be created on someone's behalf.
  delete bookObject._id;
  delete bookObject.userId;

  const ratings = (bookObject.ratings || []).map((rating) => ({
    // Force every incoming rating onto the authenticated user for the same reason.
    userId: req.auth.userId,
    grade: rating.grade,
  }));

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    ratings,
    averageRating: computeAverage(ratings),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });

  return book
    .save()
    .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
    .catch((error) => {
      cleanupUploadedFile(req);
      return res.status(400).json({ error });
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      return res.status(200).json(book);
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  // Top 3 books by descending average rating for the homepage carousel.
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  // A multipart request carries a fresh image (book is a JSON string + a file),
  // otherwise the payload is a plain JSON body with no new image.
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      }
    : { ...req.body };

  // Never trust a client-supplied owner: keep the original userId untouched.
  delete bookObject.userId;
  delete bookObject._id;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        // The new upload has no document to attach to: drop it before returning.
        cleanupUploadedFile(req);
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      // Only the owner may modify their book.
      if (book.userId !== req.auth.userId) {
        cleanupUploadedFile(req);
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      // A replacement image leaves the old file orphaned on disk: delete it.
      if (req.file) {
        const oldFilename = filenameFromImageUrl(book.imageUrl);
        fs.unlink(`images/${oldFilename}`, () => {});
      }

      return Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id },
      )
        .then(() => res.status(200).json({ message: 'Livre modifié !' }))
        .catch((error) => {
          cleanupUploadedFile(req);
          return res.status(400).json({ error });
        });
    })
    .catch((error) => {
      cleanupUploadedFile(req);
      return res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      // Only the owner may delete their book.
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      // Remove the backing image first so deleting the document doesn't orphan it.
      const filename = filenameFromImageUrl(book.imageUrl);
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.createRating = (req, res, next) => {
  // The rater is always the authenticated user, never a client-supplied id.
  const userId = req.auth.userId;
  const { rating } = req.body;

  // Ratings are whole stars from 0 to 5; reject anything outside that range.
  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être un entier entre 0 et 5.' });
  }

  return Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      // Enforce one rating per user to keep the average honest.
      if (book.ratings.some((r) => r.userId === userId)) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      book.ratings.push({ userId, grade: rating });
      book.averageRating = computeAverage(book.ratings);

      return book
        .save()
        // Return the full updated document so the frontend can map _id -> id.
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(400).json({ error }));
};
