const multer = require('multer');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Reçoit le fichier envoyé sous le champ "image" et le garde en mémoire (pas
// sur le disque) pour que sharp puisse le retravailler avant l'enregistrement.
// On limite la taille et on filtre les types pour ne pas accepter n'importe quoi.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
}).single('image');

module.exports = upload;
