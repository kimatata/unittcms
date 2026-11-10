import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Max. file size shown in the upload UI (frontend messages "max_file_size")
export const maxFileSizeBytes = 50 * 1024 * 1024;
export const maxFileCount = 10;

export const uploadDir = path.join(__dirname, '../public/uploads');

// Create uploads folder if it does not exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    let fileName = `${baseName}${ext}`;

    // Names already handed out for this request. Multer resolves every file
    // name before the first byte is written, so checking the disk alone lets
    // two files uploaded together claim the same name and clobber each other.
    if (!req.claimedUploadNames) {
      req.claimedUploadNames = new Set();
    }

    // Check if a file with the same name already exists
    let fileExists = true;
    let fileIndex = 1;
    while (fileExists) {
      const filePath = path.join(uploadDir, fileName);
      if (fs.existsSync(filePath) || req.claimedUploadNames.has(fileName)) {
        // If a file with the same name exists, add an index and rename the file
        fileName = `${baseName}_${fileIndex}${ext}`;
        fileIndex++;
      } else {
        fileExists = false;
      }
    }

    req.claimedUploadNames.add(fileName);
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: maxFileCount,
  },
});

/**
 * Receive files sent as the "files" form field.
 * Translates multer's own errors into client errors instead of letting them
 * fall through to the default error handler as a 500.
 */
export function uploadFiles(req, res, next) {
  upload.array('files', maxFileCount)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File is too large' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Too many files uploaded' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return next(err);
    }
    next();
  });
}
