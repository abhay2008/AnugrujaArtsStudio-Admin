import { NextRequest, NextResponse } from 'next/server';
import {
  COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  checkAdminPassword,
  createSessionToken,
  verifySessionToken,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, password } = body;

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out' });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

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
