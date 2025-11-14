import { Router } from 'express';
import multer from 'multer';
import importController from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * Import Routes
 * /api/import/*
 * Admin only
 */

router.post(
  '/employees',
  authenticate,
  authorize('admin'),
  upload.single('file'),
  importController.importEmployees
);

router.post(
  '/submissions',
  authenticate,
  authorize('admin'),
  upload.single('file'),
  importController.importSubmissions
);

export default router;

