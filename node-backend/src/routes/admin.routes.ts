import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Admin Routes
 * /api/admin/*
 * Admin only
 */

// Get pending submissions
router.get(
  '/pending',
  authenticate,
  authorize('admin'),
  adminController.getPendingSubmissions
);

// Review (approve/reject) department submission
router.patch(
  '/department_submissions/:id',
  authenticate,
  authorize('admin'),
  adminController.reviewSubmission
);

// Publish master report
router.post(
  '/publish',
  authenticate,
  authorize('admin'),
  adminController.publishMasterReport
);

// Preview master report
router.get(
  '/reports/master/:period',
  authenticate,
  authorize('admin'),
  adminController.previewMasterReport
);

// List exported report files
router.get(
  '/reports/files',
  authenticate,
  authorize('admin'),
  adminController.listReportFiles
);

// Get specific report file
router.get(
  '/reports/file/:fileName',
  authenticate,
  authorize('admin'),
  adminController.getReportFile
);

// Get audit logs
router.get(
  '/audit/:entity/:id',
  authenticate,
  authorize('admin'),
  adminController.getAuditLogs
);

// Master Reports
router.get(
  '/master-reports',
  authenticate,
  authorize('admin'),
  adminController.getMasterReports
);
router.get(
  '/master-reports/:id',
  authenticate,
  authorize('admin'),
  adminController.getMasterReportById
);

export default router;

