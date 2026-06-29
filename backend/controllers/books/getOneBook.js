const Book = require('../../models/Book');

module.exports = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      return res.status(200).json(book);
    })
    .catch(next);
};
