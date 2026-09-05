import { HttpError } from '../../http/http-error.js';
import { KYC_DOCUMENT_SLOTS, KYC_EDITABLE_STATUSES } from '../../config/constants.js';
import { buildDocumentKey, deleteDocument, uploadDocument } from '../../lib/s3.js';
import { kycRepository, type SubmissionRecord } from './kyc.repository.js';
import { serializeSubmission, type SerializedSubmission } from './kyc.serializer.js';
import type { DecisionInput, IdentityInput, KycSlot } from './kyc.schemas.js';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

function generateReferenceCode() {
  return `AXP-KYC-${Math.floor(10000 + Math.random() * 90000)}`;
}

async function serialize(submission: SubmissionRecord): Promise<SerializedSubmission> {
  const documents = await kycRepository.listDocuments(submission.id);
  return serializeSubmission(submission, documents);
}

// Returns the submission the borrower is allowed to edit, creating a fresh one
// when the last attempt was rejected (or there is none yet).
async function getOrCreateEditableSubmission(userId: string): Promise<SubmissionRecord> {
  const existing = await kycRepository.findLatestSubmission(userId);

  if (existing && (KYC_EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    return existing;
  }
  if (existing && existing.status !== 'rejected') {
    throw new HttpError(400, 'Your documents are already submitted and under review.');
  }
  return kycRepository.createSubmission(userId);
}

export const kycService = {
  async getLatestSubmission(userId: string): Promise<SerializedSubmission | null> {
    const submission = await kycRepository.findLatestSubmission(userId);
    return submission ? serialize(submission) : null;
  },

  async updateIdentity(userId: string, input: IdentityInput): Promise<SerializedSubmission> {
    const submission = await getOrCreateEditableSubmission(userId);
    const updated = await kycRepository.updateSubmission(submission.id, {
      ...(input.idType ? { idType: input.idType } : {}),
      ...(input.idNumber !== undefined ? { idNumber: input.idNumber } : {}),
      updatedAt: new Date(),
    });
    return serialize(updated);
  },

  async uploadDocument(
    userId: string,
    slot: KycSlot,
    file: UploadedFile,
  ): Promise<SerializedSubmission> {
    const submission = await getOrCreateEditableSubmission(userId);
    const existingDoc = await kycRepository.findDocumentBySlot(submission.id, slot);

    const key = buildDocumentKey(userId, slot, file.originalname);
    await uploadDocument(key, file.buffer, file.mimetype);

    if (existingDoc) {
      await deleteDocument(existingDoc.storageKey).catch(() => {});
      await kycRepository.deleteDocumentById(existingDoc.id);
    }

    await kycRepository.insertDocument({
      submissionId: submission.id,
      slot,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storageKey: key,
    });

    return serialize(submission);
  },

  async removeDocument(userId: string, slot: KycSlot): Promise<SerializedSubmission> {
    const submission = await getOrCreateEditableSubmission(userId);
    const doc = await kycRepository.findDocumentBySlot(submission.id, slot);

    if (doc) {
      await deleteDocument(doc.storageKey).catch(() => {});
      await kycRepository.deleteDocumentById(doc.id);
    }

    return serialize(submission);
  },

  async submit(userId: string): Promise<SerializedSubmission> {
    const submission = await getOrCreateEditableSubmission(userId);

    const documents = await kycRepository.listDocuments(submission.id);
    const filledSlots = new Set(documents.map((doc) => doc.slot));
    const hasAllDocuments = KYC_DOCUMENT_SLOTS.every((slot) => filledSlots.has(slot));

    if (!hasAllDocuments) {
      throw new HttpError(400, 'Upload all three documents before submitting.');
    }
    if (submission.idNumber.trim().length <= 4) {
      throw new HttpError(400, 'Enter your ID number before submitting.');
    }

    const updated = await kycRepository.updateSubmission(submission.id, {
      status: 'pending',
      consentAt: new Date(),
      submittedAt: new Date(),
      decidedAt: null,
      decisionNote: null,
      referenceCode: submission.referenceCode ?? generateReferenceCode(),
      updatedAt: new Date(),
    });
    return serialize(updated);
  },

  async restart(userId: string): Promise<SerializedSubmission> {
    const latest = await kycRepository.findLatestSubmission(userId);
    if (latest && latest.status !== 'rejected') {
      throw new HttpError(400, 'Only a rejected application can be restarted.');
    }
    const created = await kycRepository.createSubmission(userId);
    return serialize(created);
  },

  // Internal-only: simulates a reviewer decision so the four status states are
  // reachable end-to-end without an admin review console.
  async applyDecision(
    userId: string,
    submissionId: string,
    input: DecisionInput,
  ): Promise<SerializedSubmission> {
    const submission = await kycRepository.findSubmissionForUser(submissionId, userId);
    if (!submission) throw new HttpError(404, 'Submission not found.');

    if (input.status === 'needs_correction' && input.flagSlot) {
      await kycRepository.flagDocument(submission.id, input.flagSlot, input.note ?? null);
    }

    const updated = await kycRepository.updateSubmission(submission.id, {
      status: input.status,
      decidedAt: new Date(),
      decidedBy: input.decidedBy,
      decisionNote: input.note ?? null,
      updatedAt: new Date(),
    });
    return serialize(updated);
  },
};
