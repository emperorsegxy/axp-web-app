import { z } from 'zod';
import { KYC_DOCUMENT_SLOTS } from '../../config/constants.js';

export type KycSlot = (typeof KYC_DOCUMENT_SLOTS)[number];

export const slotSchema = z.enum(KYC_DOCUMENT_SLOTS);

export const identitySchema = z.object({
  idType: z.enum(['passport', 'licence', 'nin']).optional(),
  idNumber: z.string().trim().max(64).optional(),
});

export const submitSchema = z.object({ consent: z.literal(true) });

export const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_correction']),
  note: z.string().trim().max(2000).optional(),
  flagSlot: slotSchema.optional(),
  decidedBy: z.string().trim().max(120).default('Compliance'),
});

export type IdentityInput = z.infer<typeof identitySchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
