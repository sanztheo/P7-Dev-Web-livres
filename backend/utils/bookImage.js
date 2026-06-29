const fs = require('fs');
const path = require('path');
const { IMAGES_DIR } = require('../config/paths');

// Retrouve le nom du fichier à partir de l'URL d'image stockée en base.
const filenameFromImageUrl = (imageUrl) => imageUrl.split('/images/')[1];

// Supprime un fichier image du disque. Le callback permet d'enchaîner une action
// une fois la suppression terminée (utilisé à la suppression d'un livre).
const deleteImageFile = (filename, callback = () => {}) =>
  fs.unlink(path.join(IMAGES_DIR, filename), callback);

// sharp écrit l'image sur le disque avant qu'on touche à la base : si
// l'enregistrement échoue ensuite, on supprime l'image pour ne pas laisser
// de fichier orphelin.
const cleanupUploadedFile = (req) => {
  if (req.file) {
    deleteImageFile(req.file.filename);
  }
};

module.exports = { filenameFromImageUrl, deleteImageFile, cleanupUploadedFile };
