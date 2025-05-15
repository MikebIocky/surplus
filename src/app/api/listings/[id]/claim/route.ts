import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import Order from '@/models/Order';
import User from '@/models/User';
import { Notification } from '@/models/Notification';
import mongoose from 'mongoose';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const { id: listingId } = params;
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const userId = (payload as { user?: { id?: string } }).user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!mongoose.Types.ObjectId.isValid(listingId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.status !== 'available') {
            return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });
        }

        if (listing.user.toString() === userId) {
            return NextResponse.json({ error: 'Cannot claim your own listing' }, { status: 400 });
        }

        const order = await Order.create({
            listing: listing._id,
            recipient: new mongoose.Types.ObjectId(userId),
            status: 'pending',
            claimedAt: new Date()
        });

        listing.status = 'pending';
        listing.pendingClaim = { user: new mongoose.Types.ObjectId(userId), requestedAt: new Date() };
        await listing.save();

        console.log('[CLAIM] Created order:', order);
        console.log('[CLAIM] Updated listing:', listing);

        const claimer = await User.findById(userId).select('name').lean();
        if (!claimer) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await Notification.create({
            user: listing.user._id,
            type: 'claim',
            message: `${claimer.name} wants to get your item: ${listing.title}`,
            link: `/dashboard/claims`
        });

        return NextResponse.json({ 
            message: 'Claim request sent to owner. Awaiting approval.',
            orderId: order._id.toString()
        });
    } catch (error) {
        console.error('Error claiming listing:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 