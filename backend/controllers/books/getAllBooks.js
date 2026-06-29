const Book = require('../../models/Book');

module.exports = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch(next);
};
