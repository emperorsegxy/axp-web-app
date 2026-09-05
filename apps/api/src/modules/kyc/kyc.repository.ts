import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { kycDocuments, kycSubmissions } from '../../db/schema.js';
import type { KycSlot } from './kyc.schemas.js';

export type SubmissionRecord = typeof kycSubmissions.$inferSelect;
export type DocumentRecord = typeof kycDocuments.$inferSelect;
type SubmissionPatch = Partial<typeof kycSubmissions.$inferInsert>;

// The only module that touches the database for KYC data.
export const kycRepository = {
  async findLatestSubmission(userId: string): Promise<SubmissionRecord | null> {
    const [submission] = await db
      .select()
      .from(kycSubmissions)
      .where(eq(kycSubmissions.userId, userId))
      .orderBy(desc(kycSubmissions.createdAt))
      .limit(1);
    return submission ?? null;
  },

  async findSubmissionForUser(
    submissionId: string,
    userId: string,
  ): Promise<SubmissionRecord | null> {
    const [submission] = await db
      .select()
      .from(kycSubmissions)
      .where(and(eq(kycSubmissions.id, submissionId), eq(kycSubmissions.userId, userId)))
      .limit(1);
    return submission ?? null;
  },

  async createSubmission(userId: string): Promise<SubmissionRecord> {
    const [created] = await db.insert(kycSubmissions).values({ userId }).returning();
    return created;
  },

  async updateSubmission(id: string, patch: SubmissionPatch): Promise<SubmissionRecord> {
    const [updated] = await db
      .update(kycSubmissions)
      .set(patch)
      .where(eq(kycSubmissions.id, id))
      .returning();
    return updated;
  },

  async listDocuments(submissionId: string): Promise<DocumentRecord[]> {
    return db.select().from(kycDocuments).where(eq(kycDocuments.submissionId, submissionId));
  },

  async findDocumentBySlot(
    submissionId: string,
    slot: KycSlot,
  ): Promise<DocumentRecord | null> {
    const [doc] = await db
      .select()
      .from(kycDocuments)
      .where(and(eq(kycDocuments.submissionId, submissionId), eq(kycDocuments.slot, slot)))
      .limit(1);
    return doc ?? null;
  },

  async insertDocument(data: {
    submissionId: string;
    slot: KycSlot;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
  }): Promise<void> {
    await db.insert(kycDocuments).values(data);
  },

  async deleteDocumentById(id: string): Promise<void> {
    await db.delete(kycDocuments).where(eq(kycDocuments.id, id));
  },

  async flagDocument(
    submissionId: string,
    slot: KycSlot,
    flagNote: string | null,
  ): Promise<void> {
    await db
      .update(kycDocuments)
      .set({ status: 'flagged', flagNote })
      .where(and(eq(kycDocuments.submissionId, submissionId), eq(kycDocuments.slot, slot)));
  },
};
