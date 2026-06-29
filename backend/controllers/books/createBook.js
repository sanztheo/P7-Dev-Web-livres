const Book = require('../../models/Book');
const { computeAverage } = require('../../utils/averageRating');
const { cleanupUploadedFile } = require('../../utils/bookImage');

module.exports = (req, res, next) => {
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

  // on force le propriétaire depuis le jeton : jamais depuis le corps de requête
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
