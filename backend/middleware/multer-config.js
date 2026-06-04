const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Destination for optimized images. Created at startup so sharp.toFile never
// fails on a missing directory; recursive makes the call idempotent.
const IMAGES_DIR = 'images';
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Green-code target: book covers display at ~463px wide on the frontend, so
// downscaling to that width before storage avoids shipping oversized files.
const TARGET_WIDTH = 463;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// memoryStorage keeps the upload in a Buffer so sharp can transform it before
// anything touches disk — we never persist the raw, unoptimized original.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('image');

// Strips the original extension and spaces so the generated filename is safe to
// use in a URL path; the .webp extension is enforced after conversion below.
const sanitizeName = (originalname) =>
  path.parse(originalname).name.split(' ').join('_');

const optimizeImage = async (req, res, next) => {
  // Image is optional (e.g. modifyBook without a new file), so skip silently.
  if (!req.file) {
    return next();
  }

  try {
    // Date.now() suffix keeps filenames unique even when two users upload the
    // same originalname, preventing one cover from overwriting another.
    const filename = `${sanitizeName(req.file.originalname)}_${Date.now()}.webp`;

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

module.exports = { upload, optimizeImage };
