// src/app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Use next/headers for reading cookies in Route Handlers
import { jwtVerify, JWTPayload } from 'jose';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/models/User'; // Assuming IUser includes fields needed client-side

// --- Define Response Interfaces ---
interface AuthStatusResponse {
    isAuthenticated: boolean;
    user: { // Data to send back if authenticated
        id: string;
        name: string;
        email: string;
        avatar?: string;
        description?: string; // Include if needed
        rating?: number;      // Include if needed
    } | null;
}
interface ErrorResponse { error: string; }

// --- JWT Secret ---
const JWT_SECRET = process.env.JWT_SECRET;
let secretKey: Uint8Array | null = null;
if (JWT_SECRET) {
    try {
        secretKey = new TextEncoder().encode(JWT_SECRET);
    } catch (err) {
        console.error("FATAL: Failed to encode JWT_SECRET for status check:", err);
    }
} else {
    console.error("FATAL: JWT_SECRET environment variable is not set for status check.");
}

/**
 * Helper to verify token and get user ID
 */
async function verifyTokenAndGetUserId(token: string): Promise<string | null> {
    if (!secretKey) return null; // Can't verify if secret isn't ready
    try {
        const { payload } = await jwtVerify(token, secretKey) as { payload: JWTPayload & { user?: { id?: string } } }
        return payload?.user?.id || null;
    } catch (error) {
        console.warn("[API STATUS] Token verification failed:", error instanceof Error ? error.message : "Unknown error");
        return null;
    }
}

// --- GET Handler ---
export async function GET() {
    // Check if secret key was successfully generated
    if (!secretKey) {
        return NextResponse.json<ErrorResponse>({ error: 'Server configuration error' }, { status: 503 });
    }

    // Use cookies() helper from next/headers in Route Handlers
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        console.log("[API STATUS] No auth token cookie found.");
        return NextResponse.json<AuthStatusResponse>({ isAuthenticated: false, user: null }, { status: 200 }); // Return 200 OK, but indicate not authenticated
    }

    // Verify the token
    const userId = await verifyTokenAndGetUserId(token);

    if (!userId) {
        console.log("[API STATUS] Token invalid or expired.");
        // Optionally clear the invalid cookie here as well
        const response = NextResponse.json<AuthStatusResponse>({ isAuthenticated: false, user: null }, { status: 200 }); // Still 200 OK
        response.cookies.set('authToken', '', { expires: new Date(0), path: '/' }); // Clear if invalid
        return response;
    }

    // Token is valid, fetch user data
    try {
        await dbConnect();
        // Select only necessary fields for the client state
        const user = await User.findById(userId)
                             .select('name email avatar description rating')
                             .lean<Pick<IUser, 'name' | 'email' | 'avatar' | 'description' | 'rating'> & { _id: mongoose.Types.ObjectId }>();

        if (!user) {
            console.warn(`[API STATUS] User ID ${userId} from valid token not found in DB.`);
            // Token is valid but user doesn't exist? Clear cookie.
             const response = NextResponse.json<AuthStatusResponse>({ isAuthenticated: false, user: null }, { status: 200 });
             response.cookies.set('authToken', '', { expires: new Date(0), path: '/' });
             return response;
        }

        // Prepare user data for response
        const userData = {
            id: userId, // Already have the string ID from token verification
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            description: user.description,
            rating: user.rating,
        };

        console.log(`[API STATUS] User ${userId} authenticated.`);
        return NextResponse.json<AuthStatusResponse>({ isAuthenticated: true, user: userData }, { status: 200 });

    } catch (error) {
        console.error(`[API STATUS] Error fetching user data for ID ${userId}:`, error);
        return NextResponse.json<ErrorResponse>({ error: 'Error fetching user data' }, { status: 500 });
    }
}