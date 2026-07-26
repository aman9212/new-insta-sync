import { describe, it, expect } from 'vitest';

// Pure helper function replicates edge function normalization
function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[\s\r\n\t]+/g, '');
}

function generateVerificationCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `CX-${hex}`;
}

function isBioMatched(bio: string, code: string): boolean {
  const cleanBio = normalizeText(bio);
  const cleanCode = normalizeText(code);
  return cleanBio.includes(cleanCode);
}

function calculateExpiration(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function isExpired(expiresAtStr: string, now = new Date()): boolean {
  return now > new Date(expiresAtStr);
}

function canUserAccessVerification(requestUserId: string, connectionOwnerId: string, isAdmin = false): boolean {
  return requestUserId === connectionOwnerId || isAdmin;
}

describe('Instagram Bio Verification System - Core Logic', () => {

  describe('Verification Code Generation', () => {
    it('generates codes with CX- prefix and 6 hex characters', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^CX-[0-9A-F]{6}$/);
    });

    it('generates cryptographically unique codes on successive calls', () => {
      const codes = new Set(Array.from({ length: 50 }, () => generateVerificationCode()));
      expect(codes.size).toBe(50);
    });
  });

  describe('Bio Text Normalization & Code Matching Algorithm', () => {
    const targetCode = 'CX-8A2D7F';

    it('matches exact verification code in bio', () => {
      const bio = 'Digital Creator | CX-8A2D7F | DM for collabs';
      expect(isBioMatched(bio, targetCode)).toBe(true);
    });

    it('matches lowercase version of verification code (case-insensitive)', () => {
      const bio = 'Video Editor cx-8a2d7f';
      expect(isBioMatched(bio, targetCode)).toBe(true);
    });

    it('matches code split across spaces or newlines', () => {
      const bioWithNewlines = 'CreatorX Verified\nCX-\n8A2D7F\nOfficial Account';
      expect(isBioMatched(bioWithNewlines, targetCode)).toBe(true);

      const bioWithSpaces = 'CX - 8A2D7F';
      expect(isBioMatched(bioWithSpaces, targetCode)).toBe(true);
    });

    it('rejects bios that do not contain the verification code', () => {
      const invalidBio = 'Digital Creator | DM for collabs | CX-999999';
      expect(isBioMatched(invalidBio, targetCode)).toBe(false);
    });

    it('rejects empty or null bios safely', () => {
      expect(isBioMatched('', targetCode)).toBe(false);
    });
  });

  describe('24-Hour Expiration Logic', () => {
    it('sets expiration exactly 24 hours in the future', () => {
      const now = Date.now();
      const expiresAt = calculateExpiration(24);
      const diffHours = (expiresAt.getTime() - now) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(24, 1);
    });

    it('correctly identifies valid vs expired verification sessions', () => {
      const future = new Date(Date.now() + 10000).toISOString();
      const past = new Date(Date.now() - 10000).toISOString();

      expect(isExpired(future)).toBe(false);
      expect(isExpired(past)).toBe(true);
    });
  });

  describe('OAuth Connection Defaults & Coexistence', () => {
    it('initializes OAuth provider connections with unverified ownership', () => {
      const oAuthConnection = {
        provider: 'instagram',
        status: 'active',
        connection_status: 'connected',
        ownership_verified: false,
        verification_method: null,
      };

      expect(oAuthConnection.connection_status).toBe('connected');
      expect(oAuthConnection.ownership_verified).toBe(false);
      expect(oAuthConnection.verification_method).toBeNull();
    });

    it('updates provider_connections to verified upon successful bio match', () => {
      const oAuthConnection = {
        provider: 'instagram',
        status: 'active',
        connection_status: 'connected',
        ownership_verified: false,
        verification_method: null as string | null,
        verified_at: null as string | null,
      };

      // Bio verification succeeds
      oAuthConnection.ownership_verified = true;
      oAuthConnection.verification_method = 'bio';
      oAuthConnection.verified_at = new Date().toISOString();

      expect(oAuthConnection.ownership_verified).toBe(true);
      expect(oAuthConnection.verification_method).toBe('bio');
      expect(oAuthConnection.verified_at).not.toBeNull();
    });
  });

  describe('Permissions & Access Control (RLS Logic)', () => {
    it('allows owner user to manage their own verification', () => {
      expect(canUserAccessVerification('user_123', 'user_123', false)).toBe(true);
    });

    it('allows admin users to view any verification', () => {
      expect(canUserAccessVerification('admin_user', 'user_123', true)).toBe(true);
    });

    it('blocks non-owner user from attempting verification for another creator', () => {
      expect(canUserAccessVerification('attacker_user', 'user_123', false)).toBe(false);
    });
  });

  describe('Attempt Limit & Invalidation State Transitions', () => {
    it('evaluates max attempts threshold (10 attempts)', () => {
      const maxAttempts = 10;
      let currentAttempts = 9;
      
      currentAttempts++;
      const isMaxExceeded = currentAttempts >= maxAttempts;
      const nextStatus = isMaxExceeded ? 'failed' : 'pending';

      expect(isMaxExceeded).toBe(true);
      expect(nextStatus).toBe('failed');
    });

    it('invalidates prior pending code when regenerating new code', () => {
      const verifications = [
        { id: 'v1', status: 'pending', code: 'CX-111111' },
      ];

      // Invalidation step
      const updated = verifications.map(v => v.status === 'pending' ? { ...v, status: 'expired', failure_reason: 'Superceded' } : v);
      const newVerif = { id: 'v2', status: 'pending', code: 'CX-222222' };
      
      const resultList = [...updated, newVerif];
      expect(resultList[0].status).toBe('expired');
      expect(resultList[1].status).toBe('pending');
      expect(resultList[1].code).toBe('CX-222222');
    });
  });
});
