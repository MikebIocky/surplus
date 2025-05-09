import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { getUserIdFromRequest } from '@/lib/authUtils';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
    try {
        const searchParams = new URL(req.url).searchParams;
        const query = searchParams.get('q');
        
        if (!query) {
            return NextResponse.json({ users: [], listings: [] });
        }

        await dbConnect();

        // Create a case-insensitive regex for the search query
        const searchRegex = new RegExp(query, 'i');

        // Search users by name
        const users = await User.find({
            name: searchRegex,
        })
        .select('name avatar _id')
        .limit(5)
        .lean();

        // Enhanced listing search
        const listings = await Listing.find({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { quantity: searchRegex },
                { location: searchRegex }
            ],
            status: 'available' // Only show available listings
        })
        .select('title description quantity location images status _id user')
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 }) // Show newest first
        .limit(5)
        .lean();

        console.log('Raw listings from DB:', listings);

        // Format the listings data
        const formattedListings = listings.map(listing => {
            console.log('Raw listing data:', listing);
            const formatted = {
                _id: listing._id.toString(),
                title: listing.title,
                description: listing.description,
                quantity: listing.quantity,
                location: listing.location,
                images: Array.isArray(listing.images) ? listing.images.map(img => ({
                    url: img.url,
                    publicId: img.publicId
                })) : [],
                status: listing.status,
                user: (listing.user && typeof listing.user === 'object' && 'name' in listing.user && 'avatar' in listing.user)
                ? {
                    _id: listing.user._id.toString(),
                    name: listing.user.name,
                    avatar: listing.user.avatar
                  }
                : null
            };
            console.log('Formatted listing:', formatted);
            return formatted;
        });

        return NextResponse.json({
            users,
            listings: formattedListings
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        );
    }
} 