const Book = require('../../models/Book');
const {
  filenameFromImageUrl,
  deleteImageFile,
  cleanupUploadedFile,
} = require('../../utils/bookImage');

module.exports = (req, res, next) => {
  // deux cas : avec nouvelle image (multipart) ou sans (JSON simple)
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

      // nouvelle image : on supprime l'ancienne pour éviter un fichier orphelin
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
