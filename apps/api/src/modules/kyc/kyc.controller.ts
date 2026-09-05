import type { Request, Response } from 'express';
import { HttpError } from '../../http/http-error.js';
import { kycService } from './kyc.service.js';
import { decisionSchema, identitySchema, slotSchema, submitSchema } from './kyc.schemas.js';

// Controllers only deal with HTTP: parse/validate input, call the service,
// shape the response. No database access here.
export const kycController = {
  async me(req: Request, res: Response) {
    const submission = await kycService.getLatestSubmission(req.userId!);
    res.json({ submission });
  },

  async updateSubmission(req: Request, res: Response) {
    const body = identitySchema.parse(req.body);
    const submission = await kycService.updateIdentity(req.userId!, body);
    res.json({ submission });
  },

  async uploadDocument(req: Request, res: Response) {
    const slot = slotSchema.parse(req.body.slot);
    if (!req.file) throw new HttpError(400, 'Attach a file to upload.');

    const submission = await kycService.uploadDocument(req.userId!, slot, req.file);
    res.status(201).json({ submission });
  },

  async deleteDocument(req: Request, res: Response) {
    const slot = slotSchema.parse(req.params.slot);
    const submission = await kycService.removeDocument(req.userId!, slot);
    res.json({ submission });
  },

  async submit(req: Request, res: Response) {
    submitSchema.parse(req.body);
    const submission = await kycService.submit(req.userId!);
    res.json({ submission });
  },

  async restart(req: Request, res: Response) {
    const submission = await kycService.restart(req.userId!);
    res.status(201).json({ submission });
  },

  async decision(req: Request, res: Response) {
    const body = decisionSchema.parse(req.body);
    const submission = await kycService.applyDecision(
      req.userId!,
      req.params.submissionId,
      body,
    );
    res.json({ submission });
  },
};
