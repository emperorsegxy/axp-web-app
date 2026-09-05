import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/signup', asyncHandler(authController.signup));
router.post('/resend-otp', asyncHandler(authController.resendOtp));
router.post('/verify-otp', asyncHandler(authController.verifyOtp));
router.post('/signin', asyncHandler(authController.signin));
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));
router.post('/logout', authController.logout);
router.get('/me', requireAuth, asyncHandler(authController.me));

export default router;
