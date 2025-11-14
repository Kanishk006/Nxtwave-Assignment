import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * Auth Routes
 * /api/auth/*
 */

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);

// Admin only - create users
router.post('/register', authenticate, authorize('admin'), authController.register);

export default router;

