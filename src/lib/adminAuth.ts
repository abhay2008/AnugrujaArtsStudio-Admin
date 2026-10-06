export const COOKIE_NAME = 'anugruja_admin_session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24 hours

function getSecretKey(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not configured.');
  }
  return secret;
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

/**
 * Constant-time equality: compares two byte arrays without leaking where they
 * first differ. Used instead of `===` so a wrong password cannot be narrowed
 * down by timing the server's response.
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a[i] ^ b[i];
  }
  return mismatch === 0;
}

async function sha256Bytes(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

/**
 * Verify the studio password. Digests both sides with SHA-256 and compares them
 * in constant time (Web Crypto only — this module is also bundled into the Edge
 * middleware, where Node's `crypto` is unavailable). Fails closed when
 * ADMIN_PASSWORD is unset.
 */
export async function checkAdminPassword(provided: unknown): Promise<boolean> {
  if (typeof provided !== 'string' || !provided) return false;
  try {
    const [expected, received] = await Promise.all([
      sha256Bytes(getExpectedPassword()),
      sha256Bytes(provided.trim()),
    ]);
    return constantTimeEqual(expected, received);
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
