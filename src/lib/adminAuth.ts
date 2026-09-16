export const COOKIE_NAME = 'anugruja_admin_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

function getSecretKey(): string {
  return (
    process.env.SESSION_SECRET ||
    'anugruja_arts_studio_secret_session_key_2026_super_secure'
  );
}

function getExpectedPassword(): string {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    // Fail closed: never ship a built-in fallback password.
    throw new Error(
      'ADMIN_PASSWORD environment variable is not set. ' +
        'Configure it in Vercel Project Settings (or .env.local for local dev).'
    );
  }
  return password;
}

export function checkAdminPassword(provided: string): boolean {
  if (!provided) return false;
  try {
    return provided === getExpectedPassword();
  } catch {
    return false; // ADMIN_PASSWORD unconfigured — reject all attempts
  }
}

/**
 * Generate HMAC-SHA256 session token using Web Crypto API (supported in Edge + Node runtimes)
 */
export async function createSessionToken(userId = 'admin'): Promise<string> {
  const expiry = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = `${userId}:${expiry}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return Buffer.from(`${payload}:${sigHex}`).toString('base64');
}

/**
 * Verify HMAC-SHA256 session token
 */
export async function verifySessionToken(tokenString?: string): Promise<boolean> {
  if (!tokenString) return false;

  try {
    const raw = Buffer.from(tokenString, 'base64').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;

    const [userId, expiryStr, expectedSigHex] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) {
      return false;
    }

    const payload = `${userId}:${expiryStr}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(getSecretKey()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const actualSigHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return actualSigHex === expectedSigHex;
  } catch {
    return false;
  }
}
