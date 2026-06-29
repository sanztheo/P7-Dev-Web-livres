const Book = require('../models/Book');
const { computeAverage } = require('../utils/averageRating');
const {
  filenameFromImageUrl,
  deleteImageFile,
  cleanupUploadedFile,
} = require('../utils/bookImage');

exports.createBook = (req, res, next) => {
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

  delete bookObject._id;
  delete bookObject.userId;

  const ratings = (bookObject.ratings || []).map((rating) => ({
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
      return next(error);
    });
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch(next);
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      return res.status(200).json(book);
    })
    .catch(next);
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch(next);
};

exports.modifyBook = (req, res, next) => {
  let bookObject;
  if (req.file) {
    try {
      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      };
    } catch (error) {
      cleanupUploadedFile(req);
      return res.status(400).json({ message: 'Données du livre invalides.' });
    }
  } else {
    bookObject = { ...req.body };
  }

  delete bookObject.userId;
  delete bookObject._id;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        cleanupUploadedFile(req);
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      if (book.userId !== req.auth.userId) {
        cleanupUploadedFile(req);
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      if (req.file) {
        deleteImageFile(filenameFromImageUrl(book.imageUrl));
      }

      return Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id },
      )
        .then(() => res.status(200).json({ message: 'Livre modifié !' }))
        .catch((error) => {
          cleanupUploadedFile(req);
          return next(error);
        });
    })
    .catch((error) => {
      cleanupUploadedFile(req);
      return next(error);
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      deleteImageFile(filenameFromImageUrl(book.imageUrl), () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
          .catch(next);
      });
    })
    .catch(next);
};

exports.createRating = (req, res, next) => {
  const userId = req.auth.userId;
  const { rating } = req.body;

  if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être un entier entre 0 et 5.' });
  }

  return Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      if (book.ratings.some((r) => r.userId === userId)) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      book.ratings.push({ userId, grade: rating });
      book.averageRating = computeAverage(book.ratings);

      return book
        .save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch(next);
    })
    .catch(next);
};
