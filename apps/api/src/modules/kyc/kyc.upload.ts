import multer from 'multer';
import { HttpError } from '../../http/http-error.js';

// Parses a single `file` field into memory (max 10 MB, images or PDF only).
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (ok) cb(null, true);
    else cb(new HttpError(400, 'Upload a JPG, PNG or PDF up to 10 MB.'));
  },
}).single('file');
