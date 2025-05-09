// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose'; // Use jose for Edge compatibility

// --- Configuration ---
const COOKIE_NAME = 'authToken'; // Use a constant for the cookie name
const JWT_SECRET_ENV = process.env.JWT_SECRET;

// Routes requiring user to be logged IN
const PROTECTED_ROUTES = [
    '/create',
    '/profile', // Middleware handles redirecting /profile -> /profile/[id]
    '/settings',
    '/history',
    '/following',
    '/ordering',
    // Add other routes like /dashboard if needed
    // Consider '/profile/' to protect all dynamic profiles, or leave out for public viewing
];

// Routes requiring user to be logged OUT
const GUEST_ROUTES = ['/log-in', '/sign-up'];

/**
 * Verifies the JWT token from the request cookies.
 * Returns the decoded payload (containing user ID) if valid, otherwise null.
 */
async function verifyAuthToken(token: string): Promise<(JWTPayload & { user?: { id?: string } }) | null> {
    if (!JWT_SECRET_ENV) {
        console.error("MIDDLEWARE ERROR: JWT_SECRET environment variable is not set!");
        return null; // Cannot verify without secret
    }
    try {
        const secretKey = new TextEncoder().encode(JWT_SECRET_ENV);
        const { payload } = await jwtVerify(token, secretKey) as { payload: JWTPayload & { user?: { id?: string } } };
        // Optional: Add extra validation checks on the payload here if needed
        if (!payload?.user?.id) {
             console.warn("Middleware: Token payload missing user.id");
             return null;
        }
        return payload;
    } catch (error) {
        console.warn(`Middleware: Token verification failed:`, error instanceof Error ? error.message : error);
        return null; // Invalid token (expired, wrong signature, etc.)
    }
}

// --- The Middleware Function ---
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(COOKIE_NAME)?.value;

    console.log(`Middleware running for path: ${pathname}. Token found: ${!!token}`); // Add logging

    // --- Verify Token ---
    const verifiedPayload = token ? await verifyAuthToken(token) : null;
    const isAuthenticated = !!verifiedPayload;
    const loggedInUserId = verifiedPayload?.user?.id || null;

    // --- Determine Route Type ---
    const isProtectedRoute = PROTECTED_ROUTES.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));
    const isGuestRoute = GUEST_ROUTES.includes(pathname);
    const isExactlyProfileRoute = pathname === '/profile';


    // --- Redirection Logic ---

    // 1. Trying to access PROTECTED route while NOT authenticated
    if (isProtectedRoute && !isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/log-in';
        url.searchParams.set('from', pathname); // Remember where they were going
        console.log(`Middleware: Redirecting unauthenticated access from ${pathname} to ${url.pathname}`);
        // Clear potentially invalid cookie on redirect
        const response = NextResponse.redirect(url);
        if (token) response.cookies.delete(COOKIE_NAME);
        return response;
    }

    // 2. Trying to access GUEST route while AUTHENTICATED
    if (isGuestRoute && isAuthenticated) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile'; // Redirect to their main profile portal
        console.log(`Middleware: Redirecting authenticated user from ${pathname} to ${url.pathname}`);
        return NextResponse.redirect(url);
    }

    // 3. Trying to access '/profile' exactly while AUTHENTICATED -> redirect to specific ID
    if (isExactlyProfileRoute && isAuthenticated && loggedInUserId) {
         const url = request.nextUrl.clone();
         url.pathname = `/profile/${loggedInUserId}`; // Redirect to their dynamic page
         console.log(`Middleware: Redirecting /profile access to ${url.pathname}`);
         return NextResponse.redirect(url);
    }

    // --- Allow Request ---
    // If none of the redirect conditions were met, allow the request to proceed
    // console.log(`Middleware: Allowing access to ${pathname}. Auth status: ${isAuthenticated}`);
    return NextResponse.next();
}

// --- Matcher ---
// Apply middleware to relevant pages/directories, excluding static files and API routes.
export const config = {
  matcher: [
    // Match root and paths starting with these directories
    '/',
    '/create/:path*',
    '/profile/:path*', // Matches /profile AND /profile/[id] etc.
    '/settings/:path*',
    '/history/:path*',
    '/following/:path*',
    '/ordering/:path*',
    '/listings/:path*', // Apply if listings page needs auth/logic
    '/log-in',
    '/sign-up',
    // Exclude specific static files and API routes if needed (optional fine-tuning)
    // '/((?!api|_next/static|_next/image|favicon.ico).*)', // Broader exclusion
  ],
};