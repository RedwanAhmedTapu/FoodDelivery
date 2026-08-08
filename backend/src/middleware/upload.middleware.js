const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const SPREADSHEET_TYPES = ['.csv', '.xlsx', '.xls'];

const storage = multer.memoryStorage();

function fileFilter(allowedExt) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${ext}`));
    }
    return cb(null, true);
  };
}

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(IMAGE_TYPES),
});

const uploadSpreadsheet = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(SPREADSHEET_TYPES),
});

module.exports = { uploadImage, uploadSpreadsheet };
