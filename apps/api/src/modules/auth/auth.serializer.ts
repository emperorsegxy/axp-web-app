import type { UserRecord } from './auth.repository.js';

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
}

// The user shape that is safe to send to the client (no password hash, etc.).
export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerified: !!user.emailVerifiedAt,
  };
}
