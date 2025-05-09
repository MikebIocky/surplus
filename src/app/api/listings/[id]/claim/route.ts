import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import User from '@/models/User';
import Order from '@/models/Order';
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

    // Create an order record
    const order = await Order.create({
      listing: listing._id,
      recipient: userId,
      claimedAt: new Date()
    });

    // Update listing status
    await Listing.findByIdAndUpdate(params.id, {
      status: 'claimed',
      claimedBy: userId,
      claimedAt: new Date()
    });

    // Create notification for the listing owner
    await Notification.create({
      user: listing.user._id,
      type: 'claim',
      message: `${claimer.name} wants to get your item: ${listing.title}`,
      link: `/messages/${[userId, listing.user._id].sort().join('_')}`
    });

    return NextResponse.json({
      message: 'Item claimed successfully',
      orderId: order._id,
      chatId: [userId, listing.user._id].sort().join('_')
    });

  } catch (error) {
    console.error('Error claiming item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 