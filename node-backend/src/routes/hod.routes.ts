import { Router } from 'express';
import hodController from '../controllers/hod.controller';
import { authenticate, authorizeDepartment } from '../middleware/auth.middleware';
import { validateSubmissionItems, validatePeriodParam } from '../middleware/validation.middleware';

const router = Router();

/**
 * HOD Routes
 * /api/departments/*
 */

// Get department submissions for review
router.get(
  '/:id/submissions',
  authenticate,
  authorizeDepartment,
  validatePeriodParam,
  hodController.getDepartmentSubmissions
);

// Submit department aggregate
router.post(
  '/:id/aggregate',
  authenticate,
  authorizeDepartment,
  validateSubmissionItems,
  hodController.createDepartmentAggregate
);

// Update employee submission (HOD review)
router.patch(
  '/employee_submissions/:submissionRef',
  authenticate,
  hodController.updateEmployeeSubmission
);

export default router;

