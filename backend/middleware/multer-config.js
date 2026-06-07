const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Destination for optimized images, anchored on this file's location so it resolves
// to the same folder regardless of the process cwd (app.js serves __dirname/images
// too). Created at startup so sharp.toFile never fails on a missing directory.
const IMAGES_DIR = path.join(__dirname, '..', 'images');
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Green-code target: book covers display at ~463px wide on the frontend, so
// downscaling to that width before storage avoids shipping oversized files.
const TARGET_WIDTH = 463;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// memoryStorage keeps the upload in a Buffer so sharp can transform it before
// anything touches disk — we never persist the raw, unoptimized original.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  // Reject non-image uploads up front (declared MIME type) before buffering 5MB;
  // sharp remains the authoritative content check downstream.
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
}).single('image');

// Keep only the base name (path.parse drops any directory) and replace every
// character that isn't URL/filesystem-safe — spaces, separators, NUL bytes — so
// the generated name can neither traverse out of images/ nor truncate on a NUL.
const sanitizeName = (originalname) =>
  path.parse(originalname).name.replace(/[^a-zA-Z0-9._-]/g, '_');

const optimizeImage = async (req, res, next) => {
  // Image is optional (e.g. modifyBook without a new file), so skip silently.
  if (!req.file) {
    return next();
  }

  try {
    // Timestamp + random bytes keep filenames unique even if two users upload the
    // same originalname within the same millisecond, preventing one cover from
    // overwriting another.
    const filename = `${sanitizeName(req.file.originalname)}_${Date.now()}_${crypto
      .randomBytes(4)
      .toString('hex')}.webp`;

    await sharp(req.file.buffer)
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(IMAGES_DIR, filename));

    // Controllers build imageUrl from req.file.filename, mirroring multer's
    // diskStorage contract so the rest of the pipeline stays unchanged.
    req.file.filename = filename;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { upload, optimizeImage, IMAGES_DIR };
