import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Listing from '@/models/Listing';

export async function GET(request: Request) {
    try {
        // Get the category from the URL search params
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Connect to the database
        await dbConnect();

        // Build the query
        const query: Record<string, unknown> = { status: { $in: ['available', 'pending'] } };
        if (category && category !== 'all') {
            query.category = category;
        }

        // Fetch listings
        const listings = await Listing.find(query)
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .lean();

        // Transform the data to match the expected format
        const transformedListings = listings.map(listing => {
            let userId = listing.user._id?.toString?.() || listing.user.toString();
            let userName = typeof listing.user === 'object' && 'name' in listing.user ? (listing.user as { name?: string }).name || "" : "";
            let userAvatar = typeof listing.user === 'object' && 'avatar' in listing.user ? (listing.user as { avatar?: string }).avatar || "" : "";
            return {
                id: listing._id.toString(),
                title: listing.title,
                user: {
                    id: userId,
                    name: userName,
                    avatar: userAvatar
                },
                description: listing.description,
                image: listing.images?.[0]?.url, // Get the first image URL if available
                createdAt: listing.createdAt,
                category: listing.category
            };
        });

        return NextResponse.json(transformedListings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch listings' },
            { status: 500 }
        );
    }
} 