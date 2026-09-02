import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const otpPurposeEnum = pgEnum('otp_purpose', ['signup_verify', 'password_reset']);

export const kycStatusEnum = pgEnum('kyc_status', [
  'draft',
  'pending',
  'needs_correction',
  'approved',
  'rejected',
]);

export const idTypeEnum = pgEnum('id_type', ['passport', 'licence', 'nin']);

export const docSlotEnum = pgEnum('doc_slot', ['identity', 'work', 'address']);

export const docStatusEnum = pgEnum('doc_status', ['accepted', 'flagged']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  tokenVersion: integer('token_version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  purpose: otpPurposeEnum('purpose').notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const kycSubmissions = pgTable('kyc_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: kycStatusEnum('status').notNull().default('draft'),
  idType: idTypeEnum('id_type').notNull().default('passport'),
  idNumber: text('id_number').notNull().default(''),
  referenceCode: text('reference_code'),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  decidedBy: text('decided_by'),
  decisionNote: text('decision_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => kycSubmissions.id, { onDelete: 'cascade' }),
  slot: docSlotEnum('slot').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageKey: text('storage_key').notNull(),
  status: docStatusEnum('status').notNull().default('accepted'),
  flagNote: text('flag_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  otpCodes: many(otpCodes),
  kycSubmissions: many(kycSubmissions),
}));

export const kycSubmissionsRelations = relations(kycSubmissions, ({ one, many }) => ({
  user: one(users, { fields: [kycSubmissions.userId], references: [users.id] }),
  documents: many(kycDocuments),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  submission: one(kycSubmissions, {
    fields: [kycDocuments.submissionId],
    references: [kycSubmissions.id],
  }),
}));
