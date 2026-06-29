const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const { IMAGES_DIR } = require('../../config/paths');

const TARGET_WIDTH = 463;
const WEBP_QUALITY = 80;

// Nettoie le nom d'origine pour ne garder que des caractères sûrs dans le
// nom de fichier final.
const sanitizeName = (originalname) =>
  path.parse(originalname).name.replace(/[^a-zA-Z0-9._-]/g, '_');

// "Green code" : on redimensionne l'image et on la convertit en WebP (plus
// léger) avant de l'écrire sur le disque sous un nom unique. S'il n'y a pas de
// fichier (ex. modification sans nouvelle image), on passe simplement la main.
const optimizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename = `${sanitizeName(req.file.originalname)}_${Date.now()}_${crypto
      .randomBytes(4)
      .toString('hex')}.webp`;

    await sharp(req.file.buffer)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(IMAGES_DIR, filename));

    req.file.filename = filename;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = optimizeImage;
