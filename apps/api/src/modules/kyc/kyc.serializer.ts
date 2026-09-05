import { getDocumentPreviewUrl } from '../../lib/s3.js';
import type { DocumentRecord, SubmissionRecord } from './kyc.repository.js';

export interface SerializedDocument {
  slot: string;
  name: string;
  sizeLabel: string;
  status: string;
  flagNote: string | null;
  previewUrl: string;
}

export interface SerializedSubmission {
  id: string;
  status: string;
  idType: string;
  idNumber: string;
  referenceCode: string | null;
  submittedAt: Date | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  documents: SerializedDocument[];
}

// Turns DB records into the client-facing submission shape, minting short-lived
// preview URLs for each stored document.
export async function serializeSubmission(
  submission: SubmissionRecord,
  documents: DocumentRecord[],
): Promise<SerializedSubmission> {
  const serializedDocuments = await Promise.all(
    documents.map(async (doc) => ({
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
    documents: serializedDocuments,
  };
}
