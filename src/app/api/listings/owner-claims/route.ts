import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import { getUserIdFromCookieServer } from '@/lib/authUtils';
import Order from '@/models/Order';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

export async function GET() {
  await dbConnect();
  const userId = await getUserIdFromCookieServer();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const listings = await Listing.find({ user: userId, status: 'pending' })
    .populate('pendingClaim.user', 'name avatar')
    .lean();
  const orders = await Order.find({
    listing: { $in: listings.map(l => l._id) },
    status: 'pending'
  }).lean();

  const orderMap = new Map();
  orders.forEach(order => {
    const listingId = String(order.listing);
    orderMap.set(listingId, (order as any)._id.toString());
  });

  const result = listings.map(listing => ({
    id: listing._id.toString(),
    orderId: orderMap.get(listing._id.toString()),
    title: listing.title,
    image: listing.images?.[0]?.url,
    pendingClaim: listing.pendingClaim && listing.pendingClaim.user
      ? {
          user: typeof listing.pendingClaim.user === 'object' && 'name' in listing.pendingClaim.user
            ? {
                id: listing.pendingClaim.user._id?.toString() || '',
                name: listing.pendingClaim.user.name || '',
                avatar: 'avatar' in listing.pendingClaim.user ? (listing.pendingClaim.user as any).avatar || '' : ''
              }
            : {
                id: listing.pendingClaim.user?.toString() || '',
                name: '',
                avatar: ''
              },
          requestedAt: listing.pendingClaim.requestedAt
        }
      : null,
  })).filter(claim => claim.orderId);

  return NextResponse.json(result);
} 