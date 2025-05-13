// src/app/api/listings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import { getUserIdFromCookieServer } from '@/lib/authUtils'; // Your auth helper
// Import Cloudinary if needed for deleting old images
// import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if deleting images
// cloudinary.config({ ... });

interface UpdateListingRequestBody {
  title?: string;
  description?: string;
  quantity?: string;
  location?: string;
  images?: Array<{ url: string; publicId: string }>;
  expiryDate?: string | null;
  contact?: string | null;
  // Potentially status if you allow editing status
}

interface SuccessResponse { message: string; listingId: string; }
interface ErrorResponse { error: string; }

// --- PUT Handler (for full updates, or use PATCH for partial) ---
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } } // Get listing ID from route params
) {
    const listingId = params.id;
    const loggedInUserId = await getUserIdFromCookieServer();

    // 1. Check Authentication
    if (!loggedInUserId) {
        return NextResponse.json<ErrorResponse>({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Validate Listing ID Format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return NextResponse.json<ErrorResponse>({ error: 'Invalid listing ID format' }, { status: 400 });
    }

    // 3. Parse Request Body
    let updateData: UpdateListingRequestBody;
    try {
        updateData = await req.json();
    } catch (e) {
        return NextResponse.json<ErrorResponse>({ error: 'Invalid request body' }, { status: 400 });
    }

    // Basic validation on update data (can be more specific)
    if (!updateData.title || !updateData.description || !updateData.quantity || !updateData.location) {
         return NextResponse.json<ErrorResponse>({ error: 'Missing required fields: title, description, quantity, location' }, { status: 400 });
    }


    try {
        await dbConnect();

        // 4. Find the Listing to Update
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return NextResponse.json<ErrorResponse>({ error: 'Listing not found' }, { status: 404 });
        }

        // 5. Authorization Check: Ensure logged-in user owns the listing
        if (listing.user.toString() !== loggedInUserId) {
            console.warn(`[API UPDATE] Unauthorized attempt: User ${loggedInUserId} tried to update listing ${listingId} owned by ${listing.user.toString()}`);
            return NextResponse.json<ErrorResponse>({ error: 'Forbidden: You do not own this listing' }, { status: 403 });
        }

        // 6. Update Listing Fields
        listing.title = updateData.title;
        listing.description = updateData.description;
        listing.quantity = updateData.quantity;
        listing.location = updateData.location;
        listing.contact = updateData.contact ?? undefined; // Set to undefined if null/empty
        listing.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : undefined; // Convert date string, set undefined if null/empty

        // Update images if new ones were provided
        if (updateData.images && updateData.images.length > 0) {
            listing.images = updateData.images;
        }
        // You might want to update status separately via a different endpoint/logic

        // 7. Save Updated Listing
        await listing.save();

        console.log(`[API UPDATE] Listing ${listingId} updated successfully by user ${loggedInUserId}`);
        return NextResponse.json<SuccessResponse>(
            { message: 'Listing updated successfully', listingId: listing._id.toString() },
            { status: 200 }
        );

    } catch (error) {
        console.error('DB Connection Error');
        if (error instanceof Error && (error as { name?: string }).name === 'ValidationError') {
            const messages = Object.values((error as unknown as { errors: Record<string, { message: string }> }).errors).map((err) => err.message);
            return NextResponse.json<ErrorResponse>({ error: `Validation failed: ${messages.join(', ')}` }, { status: 400 });
        }
        throw new Error('DB Connection Error');
    }
}

// GET handler to fetch a single listing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const listing = await Listing.findById(params.id)
      .populate('user', 'name email')
      .lean();

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const userId = await getUserIdFromCookieServer();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the listing and check ownership
    const listing = await Listing.findById(params.id);
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if the user is the owner
    if (listing.user.toString() !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this listing' }, { status: 403 });
    }

    // Delete the listing
    await listing.deleteOne();

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}