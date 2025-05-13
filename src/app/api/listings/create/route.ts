// src/app/api/listings/create/route.ts
import { NextRequest, NextResponse } from 'next/server';

// --- DB & Model Imports ---
import dbConnect from '@/lib/dbConnect';        // Ensure correct path
import Listing from '@/models/Listing';       // Ensure Listing model exists
import { getUserIdFromCookieServer } from '@/lib/authUtils';

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
      category,
      images,
      expiryDate,
      contact,
    } = body;

    // 4. Validate required fields
    if (!title || !description || !quantity || !location || !category || !images || !Array.isArray(images) || images.length === 0) {
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
      category,
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