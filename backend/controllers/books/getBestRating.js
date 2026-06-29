const Book = require('../../models/Book');

const TOP_LIMIT = 3;

// Les 3 livres les mieux notés (tri décroissant sur la moyenne).
module.exports = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(TOP_LIMIT)
    .then((books) => res.status(200).json(books))
    .catch(next);
};
