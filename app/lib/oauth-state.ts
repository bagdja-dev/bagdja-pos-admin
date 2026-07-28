/**
 * State parameter yang menyimpan code_verifier + next path terenkripsi (AES-256-GCM).
 *
 * Kenapa bukan cookie: Safari (semua mode, termasuk private) tidak konsisten
 * menyimpan Set-Cookie yang menempel di response redirect — cookie yang di-set
 * di /auth/login sebelum redirect ke IdP kadang tidak kebaca lagi di
 * /auth/callback, menyebabkan state_mismatch di iOS meski Chrome/Android normal.
 * Dengan menaruh code_verifier di dalam `state` (bukan cookie), datanya ikut
 * lewat query param redirect IdP — tidak pernah bergantung pada cookie jar
 * bertahan lintas redirect. Pola ini mengikuti `core/bagdja-login/src/lib/oauth.ts`.
 */
import crypto from 'crypto';

export interface AdminOAuthState {
  codeVerifier: string;
  next: string | null;
  nonce: string;
  iat: number;
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeKey(keyStr: string): Buffer {
  return Buffer.from(keyStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export function encryptOAuthState(
  data: { codeVerifier: string; next: string | null },
  encryptionKey: string,
): string {
  const payload: AdminOAuthState = {
    ...data,
    nonce: crypto.randomBytes(16).toString('hex'),
    iat: Date.now(),
  };

  const iv = crypto.randomBytes(16);
  const key = decodeKey(encryptionKey);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
  return base64url(combined);
}

export function decryptOAuthState(
  state: string,
  encryptionKey: string,
  maxAgeSeconds = 600,
): AdminOAuthState | null {
  try {
    const combined = Buffer.from(state.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (combined.length < 32) return null;

    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const encrypted = combined.subarray(32);

    const key = decodeKey(encryptionKey);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted) as AdminOAuthState;
    if (!payload.codeVerifier || !payload.nonce || typeof payload.iat !== 'number') {
      return null;
    }

    const age = (Date.now() - payload.iat) / 1000;
    if (age > maxAgeSeconds) return null;

    return payload;
  } catch {
    return null;
  }
}
