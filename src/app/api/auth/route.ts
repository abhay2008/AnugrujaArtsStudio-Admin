import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  checkAdminPassword,
  createSessionToken,
  verifySessionToken,
} from '@/lib/adminAuth';
import { checkThrottle, clientKey, recordFailure, recordSuccess } from '@/lib/loginThrottle';

function lockedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: `Too many failed attempts. Try again in ${Math.max(
        1,
        Math.ceil(retryAfterSeconds / 60)
      )} minute(s).`,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' },
    }
  );
}

export async function POST(req: NextRequest) {
  // Same speed bump the public site's console has: a few wrong guesses from one
  // client and the door closes for a cooldown. Fails closed either way —
  // ADMIN_PASSWORD unset means every attempt is refused.
  const key = clientKey(req.headers);
  const gate = checkThrottle(key);
  if (gate.locked) return lockedResponse(gate.retryAfterSeconds);

  try {
    const body = await req.json().catch(() => ({}));
    const { action, password } = body as { action?: string; password?: unknown };

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out' });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    if (!(await checkAdminPassword(password))) {
      recordFailure(key);
      const after = checkThrottle(key);
      if (after.locked) return lockedResponse(after.retryAfterSeconds);
      return NextResponse.json(
        {
          error: `Wrong portal password. ${after.failuresRemaining} attempt${
            after.failuresRemaining === 1 ? '' : 's'
          } left before a temporary lockout.`,
        },
        { status: 401 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }

  recordSuccess(key);

  try {
    const token = await createSessionToken();
    const response = NextResponse.json({ success: true, message: 'Authentication successful' });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);
  return NextResponse.json({ authenticated: isValid });
}
