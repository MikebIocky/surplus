import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import { getUserIdFromCookieServer } from '@/lib/authUtils';

export async function GET() {
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
              ? (() => {
                  const u = listing.pendingClaim.user as unknown as { name?: string; avatar?: string; _id?: string };
                  return {
                    id: u._id?.toString?.() || listing.pendingClaim.user.toString(),
                    name: u.name || '',
                    avatar: u.avatar || ''
                  };
                })()
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