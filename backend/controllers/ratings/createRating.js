const Book = require('../../models/Book');
const { computeAverage } = require('../../utils/averageRating');

const MIN_GRADE = 0;
const MAX_GRADE = 5;

// Ajoute la note d'un utilisateur à un livre, puis recalcule sa moyenne.
module.exports = (req, res, next) => {
  const userId = req.auth.userId;
  const { rating } = req.body;

  if (!Number.isInteger(rating) || rating < MIN_GRADE || rating > MAX_GRADE) {
    return res.status(400).json({ message: 'La note doit être un entier entre 0 et 5.' });
  }

  return Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      // un utilisateur ne peut noter un livre qu'une seule fois
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
