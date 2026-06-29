const Book = require('../../models/Book');
const { filenameFromImageUrl, deleteImageFile } = require('../../utils/bookImage');

module.exports = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé !' });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ message: '403: unauthorized request' });
      }

      // on supprime d'abord l'image du disque, puis le document en base
      deleteImageFile(filenameFromImageUrl(book.imageUrl), () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
          .catch(next);
      });
    })
    .catch(next);
};
