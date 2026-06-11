const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IMAGES_DIR = path.join(__dirname, '..', 'images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });

const TARGET_WIDTH = 463;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
}).single('image');

const sanitizeName = (originalname) =>
  path.parse(originalname).name.replace(/[^a-zA-Z0-9._-]/g, '_');

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

module.exports = { upload, optimizeImage, IMAGES_DIR };
