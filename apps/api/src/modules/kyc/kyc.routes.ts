import { Router } from 'express';
import { asyncHandler } from '../../http/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireInternalSecret } from '../../middleware/internal-secret.js';
import { uploadSingleFile } from './kyc.upload.js';
import { kycController } from './kyc.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/me', asyncHandler(kycController.me));
router.patch('/submission', asyncHandler(kycController.updateSubmission));
router.post('/documents', uploadSingleFile, asyncHandler(kycController.uploadDocument));
router.delete('/documents/:slot', asyncHandler(kycController.deleteDocument));
router.post('/submit', asyncHandler(kycController.submit));
router.post('/restart', asyncHandler(kycController.restart));
router.post(
  '/:submissionId/decision',
  requireInternalSecret,
  asyncHandler(kycController.decision),
);

export default router;
