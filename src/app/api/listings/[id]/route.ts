// src/app/api/listings/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function PUT(
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
        const updatedListing = await Listing.findByIdAndUpdate(
            listingId,
            { $set: body },
            { new: true }
        ).populate('user', 'name avatar');

        return NextResponse.json(updatedListing);
    } catch (error) {
        console.error('Error updating listing:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET handler to fetch a single listing
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
        const resolvedParams = await params;
        const { id: listingId } = resolvedParams;

        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
        }

    await dbConnect();
        const listing = await Listing.findById(listingId)
            .populate('user', 'name avatar')
      .lean();

    if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
        console.error('Error fetching listing:', error);
    return NextResponse.json(
            { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a listing
export async function DELETE(
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

        await Listing.findByIdAndDelete(listingId);
    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}