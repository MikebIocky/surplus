import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import { getUserIdFromCookieServer } from '@/lib/authUtils';
import { Notification } from '@/models/Notification';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { params } = context;
    const { id } = await params;

    const { action } = await req.json();
    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.user.toString() !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    if (listing.status !== 'pending' || !listing.pendingClaim) {
      return NextResponse.json({ error: 'No pending claim to review' }, { status: 400 });
    }

    // Ensure category is present before saving
    if (!listing.category) {
      const original = await Listing.findById(id).lean();
      if (original && original.category) {
        listing.category = original.category;
      } else {
        listing.category = 'other';
      }
    }

    if (action === 'accept') {
      listing.status = 'claimed';
      listing.claimedBy = listing.pendingClaim.user;
      listing.claimedAt = new Date();
      // Notify the claimant
      if (listing.pendingClaim.user) {
        await Notification.create({
          user: listing.pendingClaim.user.toString(),
          type: 'claim-accepted',
          message: `Your claim for '${listing.title}' was accepted!`,
          link: `/product/${listing._id}`
        });
      }
      listing.pendingClaim = undefined;
      await listing.save();
      return NextResponse.json({ message: 'Claim accepted and item marked as unavailable.' });
    } else if (action === 'decline') {
      // Notify the claimant
      if (listing.pendingClaim.user) {
        await Notification.create({
          user: listing.pendingClaim.user.toString(),
          type: 'claim-declined',
          message: `Your claim for '${listing.title}' was declined.`,
          link: `/product/${listing._id}`
        });
      }
      listing.status = 'available';
      listing.pendingClaim = undefined;
      await listing.save();
      return NextResponse.json({ message: 'Claim declined and item is available again.' });
    }
  } catch (error) {
    console.error('Error reviewing claim:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 