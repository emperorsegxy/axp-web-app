import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { otpCodes, users } from '../../db/schema.js';
import type { OtpPurpose } from './auth.schemas.js';

export type UserRecord = typeof users.$inferSelect;
export type OtpRecord = typeof otpCodes.$inferSelect;

// The only module that touches the database for auth/user data.
export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }): Promise<UserRecord> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async markEmailVerified(userId: string): Promise<UserRecord> {
    const [user] = await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  // Rotating tokenVersion invalidates every other active session cookie.
  async updatePasswordAndBumpTokenVersion(
    userId: string,
    passwordHash: string,
  ): Promise<UserRecord | null> {
    const [user] = await db
      .update(users)
      .set({
        passwordHash,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user ?? null;
  },

  async insertOtp(data: {
    userId: string;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await db.insert(otpCodes).values(data);
  },

  async findRecentOtp(
    userId: string,
    purpose: OtpPurpose,
    createdAfter: Date,
  ): Promise<OtpRecord | null> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.purpose, purpose),
          gt(otpCodes.createdAt, createdAfter),
        ),
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);
    return otp ?? null;
  },

  async findActiveOtp(userId: string, purpose: OtpPurpose): Promise<OtpRecord | null> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.userId, userId),
          eq(otpCodes.purpose, purpose),
          isNull(otpCodes.consumedAt),
          gt(otpCodes.expiresAt, new Date()),
        ),
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);
    return otp ?? null;
  },

  async incrementOtpAttempts(otpId: string, currentAttempts: number): Promise<void> {
    await db.update(otpCodes).set({ attempts: currentAttempts + 1 }).where(eq(otpCodes.id, otpId));
  },

  async consumeOtp(otpId: string): Promise<void> {
    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otpId));
  },
};
