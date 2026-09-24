/**
 * File Upload Route
 *
 * POST /upload - Upload a file and emit event
 *
 * Multipart form data:
 * - file: Binary file
 * - buildId (optional): Associated build ID
 *
 * Response:
 * { fileId: string, url: string }
 */

import { Router, type Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import multer, { Multer } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../services/event-bus.js';
import { asyncHandler, AppError } from '../middleware/error.js';

const router: ExpressRouter = Router();

// MIME type and extension whitelist for manufacturing domain
// Supports logs, test reports, documents, spreadsheets, images, and archives
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
];

const ALLOWED_EXTENSIONS = [
  '.txt',
  '.log',
  '.csv',
  '.json',
  '.xml',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.zip',
  '.gz',
  '.tar',
  '.tar.gz',
];

// Configure Multer
const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  },
});

const upload: Multer = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file) {
      return cb(new AppError(400, 'No file provided'));
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError(
          400,
          `Invalid file type: '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        )
      );
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidExt = ALLOWED_EXTENSIONS.some((allowedExt) => {
      // Handle .tar.gz as a special case
      if (allowedExt === '.tar.gz') {
        return file.originalname.toLowerCase().endsWith('.tar.gz');
      }
      return ext === allowedExt;
    });

    if (!isValidExt) {
      return cb(
        new AppError(
          400,
          `Invalid file extension: '${ext}' is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
        )
      );
    }

    cb(null, true);
  },
});

/**
 * POST /upload - Upload file and emit event
 */
router.post(
  '/',
  upload.single('file'),
  (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    // Handle Multer-specific errors
    if (err) {
      const multerError = err as { code?: string };
      if (multerError.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File too large',
          message: `File exceeds the maximum size limit of 50MB`,
        });
      }
      if (multerError.code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({
          error: 'Too many parts',
          message: 'Request contains too many form fields',
        });
      }
      // Pass other errors to next middleware
      next(err);
      return;
    }
    next();
    return;
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, 'File is required');
    }

    const fileId = path.parse(req.file.filename).name;
    const buildId = req.body.buildId as string | undefined;

    // Emit event for real-time subscribers
    eventBus.emitFileUploaded({
      fileId,
      buildId,
      fileName: req.file.originalname,
    });

    res.json({
      fileId,
      fileName: req.file.originalname,
      size: req.file.size,
      url: `/files/${req.file.filename}`,
    });
  })
);

/**
 * GET /files/:fileId - Serve uploaded file
 */
router.get('/:fileId', (req: Request, res: Response) => {
  const filePath = path.join(uploadDir, req.params.fileId);

  // Simple file serving (production: use CDN or static middleware)
  res.sendFile(filePath, (err: unknown) => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

export default router;
