import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import User from '@/models/User';
import { Notification } from '@/models/Notification';
import { getUserIdFromCookieServer } from '@/lib/authUtils';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const userId = await getUserIdFromCookieServer();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the listing and check if it's available
    const listing = await Listing.findById(params.id)
      .populate('user', 'name')
      .lean();
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status !== 'available') {
      return NextResponse.json({ error: 'Item is no longer available' }, { status: 400 });
    }

    // Get the claimer's name for the notification
    const claimer = await User.findById(userId).select('name').lean();
    if (!claimer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Set listing to pending and store pendingClaim
    await Listing.findByIdAndUpdate(params.id, {
      status: 'pending',
      pendingClaim: {
        user: userId,
        requestedAt: new Date()
      }
    });

    // Create notification for the listing owner
    await Notification.create({
      user: listing.user._id,
      type: 'claim',
      message: `${claimer.name} wants to get your item: ${listing.title}`,
      link: `/dashboard/claims` // Link to the owner's claims review page
    });

    return NextResponse.json({
      message: 'Claim request sent to owner. Awaiting approval.'
    });

  } catch (error) {
    console.error('Error claiming item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 