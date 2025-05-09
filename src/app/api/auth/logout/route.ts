// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

    // Clear the HttpOnly cookie by setting its expiration date to the past
    response.cookies.set('authToken', '', { // Set value to empty string
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    console.log("[API LOGOUT] Auth token cookie cleared.");
    return response;

  } catch (error) {
    console.error('[API LOGOUT] Error:', error);
    return NextResponse.json({ error: 'Logout failed due to server error' }, { status: 500 });
  }
}