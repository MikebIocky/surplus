// src/app/api/listings/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose'; // Use jose for consistency with middleware potentially
import mongoose from 'mongoose';

// --- DB & Model Imports ---
import dbConnect from '@/lib/dbConnect';        // Ensure correct path
import Listing from '@/models/Listing';       // Ensure Listing model exists
import User from '@/models/User';           // Ensure User model exists
import { getUserIdFromCookieServer } from '@/lib/authUtils';

// --- Define Request Body Interface ---
// Matches the 'listingData' object sent from the frontend
interface CreateListingRequestBody {
  title: string;
  description: string;
  quantity: string;
  location: string;
  images: string[];
  expiryDate?: string | null; // Allow null from frontend if date cleared
  contact?: string | null;  // Allow null from frontend if cleared
}

// --- Define Response Interfaces ---
interface SuccessResponse {
  message: string;
  listingId: string;
}
interface ErrorResponse {
  error: string;
}

// --- Helper: Get Logged In User ID from Request ---
// Extracts user ID from JWT in Authorization header or Cookie
async function getLoggedInUserIdFromRequest(req: NextRequest): Promise<string | null> {
    let token: string | undefined = undefined;

    // 1. Try Authorization header first
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    // 2. If not in header, try cookie (adjust cookie name if needed)
    if (!token) {
        token = req.cookies.get('authToken')?.value;
    }

    if (!token) {
        console.log("[API CREATE LISTING] No token found in header or cookies.");
        return null; // No token found
    }

    // 3. Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("[API CREATE LISTING] CRITICAL: JWT_SECRET not set.");
        return null; // Server configuration error
    }
    const secretKey = new TextEncoder().encode(secret); // For jose

    try {
        // Use jose.jwtVerify for Edge compatibility (if needed) or stick with jwt.verify
        const { payload } = await jwtVerify(token, secretKey) as { payload: { user?: { id?: string } } };
        // OR using jsonwebtoken:
        // const decoded = jwt.verify(token, secret) as { user?: { id?: string } };
        // const userId = decoded?.user?.id || null;
        const userId = payload?.user?.id || null;
        return userId;
    } catch (error) {
        console.warn("[API CREATE LISTING] Token verification failed:", error instanceof Error ? error.message : error);
        return null; // Token invalid or expired
    }
}

// --- POST Handler ---
export async function POST(request: NextRequest) {
  try {
    // 1. Connect to DB
    await dbConnect();

    // 2. Get user ID from cookie
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const {
      title,
      description,
      quantity,
      location,
      images,
      expiryDate,
      contact,
    } = body;

    // 4. Validate required fields
    if (!title || !description || !quantity || !location || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 5. Create listing
    const listing = await Listing.create({
      title,
      description,
      quantity,
      location,
      images,
      expiryDate: expiryDate || null,
      contact: contact || null,
      user: userId,
      status: 'available',
    });

    // 6. Return success response
    return NextResponse.json({
      message: 'Listing created successfully',
      listingId: listing._id,
    });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}