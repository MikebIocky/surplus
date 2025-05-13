import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { getUserIdFromCookieServer } from '@/lib/authUtils';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find all listings owned by the user with status 'pending'
    const listings = await Listing.find({ user: userId, status: 'pending' })
      .populate('pendingClaim.user', 'name avatar')
      .lean();

    // Format the response
    const result = listings.map(listing => ({
      id: listing._id.toString(),
      title: listing.title,
      image: listing.images?.[0]?.url,
      pendingClaim: listing.pendingClaim
        ? {
            user: listing.pendingClaim.user
              ? {
                  id: listing.pendingClaim.user._id?.toString?.() || listing.pendingClaim.user.toString(),
                  name: (listing.pendingClaim.user as any).name || '',
                  avatar: (listing.pendingClaim.user as any).avatar || ''
                }
              : null,
            requestedAt: listing.pendingClaim.requestedAt
          }
        : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching owner claims:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 