import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import Order, { IOrder } from '@/models/Order';
import mongoose from 'mongoose';
import { Notification } from '@/models/Notification';

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

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
        }

        await dbConnect();
        const listing = await Listing.findById(listingId);

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.user.toString() !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { action, orderId } = body;

        if (!action || !orderId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const order = await Order.findById(orderId) as IOrder & { status: string };
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.listing.toString() !== listingId) {
            return NextResponse.json({ error: 'Order does not belong to this listing' }, { status: 400 });
        }

        if (action === 'accept') {
            // Update order status
            order.status = 'approved';
            
            // Update listing status and claim details
            listing.status = 'claimed';
            if (listing.pendingClaim?.user) {
                listing.claimedBy = listing.pendingClaim.user;
                listing.claimedAt = new Date();
                
                // Notify the claimant
                await Notification.create({
                    user: listing.pendingClaim.user.toString(),
                    type: 'claim-accepted',
                    message: `Your claim for '${listing.title}' was accepted!`,
                    link: `/product/${listing._id}`
                });
            }
            listing.pendingClaim = undefined;
        } else if (action === 'decline') {
            // Update order status
            order.status = 'rejected';
            
            // Reset listing status
            listing.status = 'available';
            if (listing.pendingClaim?.user) {
                // Notify the claimant
                await Notification.create({
                    user: listing.pendingClaim.user.toString(),
                    type: 'claim-declined',
                    message: `Your claim for '${listing.title}' was declined.`,
                    link: `/product/${listing._id}`
                });
            }
            listing.pendingClaim = undefined;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Save both the order and listing changes
        await Promise.all([order.save(), listing.save()]);

        return NextResponse.json({ 
            message: `Claim ${action}ed successfully`,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error reviewing claim:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 