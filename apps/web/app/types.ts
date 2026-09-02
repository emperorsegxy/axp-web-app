export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
}

export type IdType = 'passport' | 'licence' | 'nin';
export type DocSlot = 'identity' | 'work' | 'address';
export type KycStatus = 'draft' | 'pending' | 'needs_correction' | 'approved' | 'rejected';

export interface KycDocument {
  slot: DocSlot;
  name: string;
  sizeLabel: string;
  status: 'accepted' | 'flagged';
  flagNote: string | null;
  previewUrl: string;
}

export interface KycSubmission {
  id: string;
  status: KycStatus;
  idType: IdType;
  idNumber: string;
  referenceCode: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  documents: KycDocument[];
}
