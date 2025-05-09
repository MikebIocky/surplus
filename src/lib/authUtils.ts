// src/lib/authUtils.ts (Example)
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Can use in Route Handlers via req.cookies instead
import { jwtVerify, JWTPayload } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
let secretKey: Uint8Array | null = null;
if (JWT_SECRET) secretKey = new TextEncoder().encode(JWT_SECRET);

// Helper for API Routes/Route Handlers
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
    const token = req.cookies.get('authToken')?.value;
    if (!token || !secretKey) return null;
    try {
        const { payload } = await jwtVerify(token, secretKey) as { payload: JWTPayload & { user?: { id?: string } } };
        return payload?.user?.id || null;
    } catch (error) {
        console.warn("[AUTH UTIL] Token verification failed in API:", error instanceof Error ? error.message : error);
        return null;
    }
}

// Helper for Server Components (if needed elsewhere)
export async function getUserIdFromCookieServer(): Promise<string | null> {
    const cookieStore = await cookies();
     const token = cookieStore.get('authToken')?.value;
     if (!token || !secretKey) return null;
    try {
        const { payload } = await jwtVerify(token, secretKey) as { payload: JWTPayload & { user?: { id?: string } } };
        return payload?.user?.id || null;
    } catch (error) {
        console.error('Error verifying JWT:', error);
        return null;
    }
}