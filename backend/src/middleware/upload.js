const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Local disk storage for ad images. See backend/README.md ("Image storage
// decision") for why local /uploads was chosen over Cloudinary for now.
const uploadRoot = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const adsUploadDir = path.join(uploadRoot, 'ads');

// Ensure the target directory exists before multer tries to write into it.
fs.mkdirSync(adsUploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, adsUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error('Only JPEG, PNG, WEBP or GIF image files are allowed'));
};

// Fixed product rule (not ops-configurable): max 3 images per ad, 400KB each.
const MAX_AD_IMAGES = 3;
const MAX_AD_IMAGE_SIZE_BYTES = 400 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: MAX_AD_IMAGES,
    fileSize: MAX_AD_IMAGE_SIZE_BYTES,
  },
});

module.exports = { upload, adsUploadDir, uploadRoot, MAX_AD_IMAGES, MAX_AD_IMAGE_SIZE_BYTES };
