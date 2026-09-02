import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { kycDocuments, kycSubmissions } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { buildDocumentKey, deleteDocument, getDocumentPreviewUrl, uploadDocument } from '../lib/s3.js';
import { env } from '../env.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (ok) cb(null, true);
    else cb(new HttpError(400, 'Upload a JPG, PNG or PDF up to 10 MB.'));
  },
});

const EDITABLE_STATUSES = ['draft', 'needs_correction'] as const;

async function getLatestSubmission(userId: string) {
  const [submission] = await db
    .select()
    .from(kycSubmissions)
    .where(eq(kycSubmissions.userId, userId))
    .orderBy(desc(kycSubmissions.createdAt))
    .limit(1);
  return submission ?? null;
}

async function getOrCreateEditableSubmission(userId: string) {
  const existing = await getLatestSubmission(userId);
  if (existing && (EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    return existing;
  }
  if (existing && existing.status !== 'rejected') {
    throw new HttpError(400, 'Your documents are already submitted and under review.');
  }
  const [created] = await db.insert(kycSubmissions).values({ userId }).returning();
  return created;
}

async function serializeSubmission(submission: typeof kycSubmissions.$inferSelect) {
  const docs = await db
    .select()
    .from(kycDocuments)
    .where(eq(kycDocuments.submissionId, submission.id));

  const documents = await Promise.all(
    docs.map(async (doc) => ({
      slot: doc.slot,
      name: doc.originalName,
      sizeLabel: `${(doc.sizeBytes / 1048576).toFixed(1)} MB`,
      status: doc.status,
      flagNote: doc.flagNote,
      previewUrl: await getDocumentPreviewUrl(doc.storageKey),
    })),
  );

  return {
    id: submission.id,
    status: submission.status,
    idType: submission.idType,
    idNumber: submission.idNumber,
    referenceCode: submission.referenceCode,
    submittedAt: submission.submittedAt,
    decidedAt: submission.decidedAt,
    decisionNote: submission.decisionNote,
    documents,
  };
}

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const submission = await getLatestSubmission(req.userId!);
    res.json({ submission: submission ? await serializeSubmission(submission) : null });
  }),
);

const identitySchema = z.object({
  idType: z.enum(['passport', 'licence', 'nin']).optional(),
  idNumber: z.string().trim().max(64).optional(),
});

router.patch(
  '/submission',
  asyncHandler(async (req, res) => {
    const body = identitySchema.parse(req.body);
    const submission = await getOrCreateEditableSubmission(req.userId!);
    const [updated] = await db
      .update(kycSubmissions)
      .set({
        ...(body.idType ? { idType: body.idType } : {}),
        ...(body.idNumber !== undefined ? { idNumber: body.idNumber } : {}),
        updatedAt: new Date(),
      })
      .where(eq(kycSubmissions.id, submission.id))
      .returning();

    res.json({ submission: await serializeSubmission(updated) });
  }),
);

router.post(
  '/documents',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const slot = z.enum(['identity', 'work', 'address']).parse(req.body.slot);
    if (!req.file) throw new HttpError(400, 'Attach a file to upload.');

    const submission = await getOrCreateEditableSubmission(req.userId!);

    const [existingDoc] = await db
      .select()
      .from(kycDocuments)
      .where(and(eq(kycDocuments.submissionId, submission.id), eq(kycDocuments.slot, slot)))
      .limit(1);

    const key = buildDocumentKey(req.userId!, slot, req.file.originalname);
    await uploadDocument(key, req.file.buffer, req.file.mimetype);

    if (existingDoc) {
      await deleteDocument(existingDoc.storageKey).catch(() => {});
      await db.delete(kycDocuments).where(eq(kycDocuments.id, existingDoc.id));
    }

    await db.insert(kycDocuments).values({
      submissionId: submission.id,
      slot,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storageKey: key,
    });

    res.status(201).json({ submission: await serializeSubmission(submission) });
  }),
);

router.delete(
  '/documents/:slot',
  asyncHandler(async (req, res) => {
    const slot = z.enum(['identity', 'work', 'address']).parse(req.params.slot);
    const submission = await getOrCreateEditableSubmission(req.userId!);

    const [doc] = await db
      .select()
      .from(kycDocuments)
      .where(and(eq(kycDocuments.submissionId, submission.id), eq(kycDocuments.slot, slot)))
      .limit(1);

    if (doc) {
      await deleteDocument(doc.storageKey).catch(() => {});
      await db.delete(kycDocuments).where(eq(kycDocuments.id, doc.id));
    }

    res.json({ submission: await serializeSubmission(submission) });
  }),
);

function generateReferenceCode() {
  return `AXP-KYC-${Math.floor(10000 + Math.random() * 90000)}`;
}

const submitSchema = z.object({ consent: z.literal(true) });

router.post(
  '/submit',
  asyncHandler(async (req, res) => {
    submitSchema.parse(req.body);
    const submission = await getOrCreateEditableSubmission(req.userId!);

    const docs = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.submissionId, submission.id));
    const slots = new Set(docs.map((d) => d.slot));
    const hasAll = ['identity', 'work', 'address'].every((s) => slots.has(s as never));

    if (!hasAll) throw new HttpError(400, 'Upload all three documents before submitting.');
    if (submission.idNumber.trim().length <= 4) {
      throw new HttpError(400, 'Enter your ID number before submitting.');
    }

    const [updated] = await db
      .update(kycSubmissions)
      .set({
        status: 'pending',
        consentAt: new Date(),
        submittedAt: new Date(),
        decidedAt: null,
        decisionNote: null,
        referenceCode: submission.referenceCode ?? generateReferenceCode(),
        updatedAt: new Date(),
      })
      .where(eq(kycSubmissions.id, submission.id))
      .returning();

    res.json({ submission: await serializeSubmission(updated) });
  }),
);

router.post(
  '/restart',
  asyncHandler(async (req, res) => {
    const latest = await getLatestSubmission(req.userId!);
    if (latest && latest.status !== 'rejected') {
      throw new HttpError(400, 'Only a rejected application can be restarted.');
    }
    const [created] = await db.insert(kycSubmissions).values({ userId: req.userId! }).returning();
    res.status(201).json({ submission: await serializeSubmission(created) });
  }),
);

// Internal-only: simulates a reviewer decision so the four status states are reachable
// end-to-end without the admin review console (explicitly out of scope for this build).
const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_correction']),
  note: z.string().trim().max(2000).optional(),
  flagSlot: z.enum(['identity', 'work', 'address']).optional(),
  decidedBy: z.string().trim().max(120).default('Compliance'),
});

router.post(
  '/:submissionId/decision',
  asyncHandler(async (req, res) => {
    if (!env.INTERNAL_ADMIN_SECRET || req.header('x-internal-secret') !== env.INTERNAL_ADMIN_SECRET) {
      throw new HttpError(404, 'Not found.');
    }
    const body = decisionSchema.parse(req.body);
    const [submission] = await db
      .select()
      .from(kycSubmissions)
      .where(and(eq(kycSubmissions.id, req.params.submissionId), eq(kycSubmissions.userId, req.userId!)))
      .limit(1);
    if (!submission) throw new HttpError(404, 'Submission not found.');

    if (body.status === 'needs_correction' && body.flagSlot) {
      await db
        .update(kycDocuments)
        .set({ status: 'flagged', flagNote: body.note ?? null })
        .where(and(eq(kycDocuments.submissionId, submission.id), eq(kycDocuments.slot, body.flagSlot)));
    }

    const [updated] = await db
      .update(kycSubmissions)
      .set({
        status: body.status,
        decidedAt: new Date(),
        decidedBy: body.decidedBy,
        decisionNote: body.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(kycSubmissions.id, submission.id))
      .returning();

    res.json({ submission: await serializeSubmission(updated) });
  }),
);

export default router;
