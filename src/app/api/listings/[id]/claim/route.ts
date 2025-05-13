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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { id: listingId } = resolvedParams;

        // Get the current user's ID from the JWT token
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

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(listingId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
        }

        await dbConnect();

        // Check if listing exists and is available
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.status !== 'available') {
            return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });
        }

        // Check if user is not the owner
        if (listing.user.toString() === userId) {
            return NextResponse.json({ error: 'Cannot claim your own listing' }, { status: 400 });
        }

        // Create order
        const order = await Order.create({
            listing: listingId,
            recipient: userId,
            status: 'pending',
            claimedAt: new Date()
        });

        // Update listing status
        listing.status = 'claimed';
        await listing.save();

        // Get the claimer's name for the notification
        const claimer = await User.findById(userId).select('name').lean();
        if (!claimer) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create notification for the listing owner
        await Notification.create({
            user: listing.user._id,
            type: 'claim',
            message: `${claimer.name} wants to get your item: ${listing.title}`,
            link: `/dashboard/claims` // Link to the owner's claims review page
        });

        return NextResponse.json({ 
            message: 'Listing claimed successfully',
            orderId: order._id
        });
    } catch (error) {
        console.error('Error claiming listing:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 