// src/app/(dashboard)/profile/[userId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image'; // Keep if ProductCard uses it
import { cookies } from 'next/headers'; // Core Next.js function for server-side cookie access
import jwt from 'jsonwebtoken'; // For verifying JWT tokens
import mongoose, { Types } from 'mongoose'; // For ObjectId validation and types

// --- DB & Model Imports ---
import dbConnect from '@/lib/dbConnect';        // Ensure correct path
import User, { IUser } from '@/models/User';        // Ensure IUser is exported and has necessary fields
import Listing, { IListing } from '@/models/Listing'; // Ensure IListing is exported
import Order, { IOrder } from '@/models/Order';     // Ensure IOrder is exported

// --- UI Component Imports ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// Note: Card components are not used directly here if ProfileTabs handles card display
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Star } from "lucide-react";
import { ProfileTabs } from '@/components/ProfileTabs'; // Ensure this Client Component exists

// --- Type Definitions ---

// Describes the user object needed for the profile header section
interface ProfileHeaderData {
  id: string;
  name: string;
  avatar?: string;
  rating?: number;
  description?: string;
}

// Describes a user object passed within listing data (e.g., for ProductCard)
interface CardUserData {
  id: string;
  name: string;
  avatar?: string;
}

// Describes a listing object ready for display (matches ProfileTabs props)
interface PopulatedListingCardData {
    id: string;
    title: string;
    user: CardUserData; // Contains original poster/lister info
    description: string;
    image?: string;
    // Include other fields ProductCard might need (status, createdAt, etc.)
    // status?: string;
    // createdAt?: Date;
}

// --- Server-Side Data Fetching Functions ---

/**
 * Fetches profile data for the user header.
 * Returns null if user not found or on error.
 */
async function fetchUserProfile(userId: string): Promise<ProfileHeaderData | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.warn(`[PROFILE PAGE] fetchUserProfile: Invalid userId format: ${userId}`);
        return null;
    }
    try {
        await dbConnect();
        // Select only fields needed for the header + ID for isOwnProfile check
        // Ensure IUser includes these fields (name, avatar, description, rating)
        const user = await User.findById(userId)
                            .select('name avatar description rating')
                            .lean<Pick<IUser, 'name' | 'avatar' | 'description' | 'rating'> & { _id: Types.ObjectId }>();

        if (!user) {
            console.log(`[PROFILE PAGE] fetchUserProfile: User not found for ID: ${userId}`);
            return null;
        }
        return {
            id: user._id.toString(),
            name: user.name,
            avatar: user.avatar,
            description: user.description,
            rating: user.rating,
        };
    } catch (error) {
        console.error(`[PROFILE PAGE] fetchUserProfile: Error fetching profile for user ${userId}:`, error);
        return null;
    }
}

/**
 * Fetches listings posted by the user.
 * Returns empty array on error or if none found.
 */
async function fetchPostedListings(userId: string): Promise<PopulatedListingCardData[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    try {
        await dbConnect();
        type PopulatedUser = { _id: Types.ObjectId; name: string; avatar?: string };
        type PopulatedDoc = IListing & { _id: Types.ObjectId; user: PopulatedUser };

        const listings = await Listing.find({ user: userId })
            .select('title description image user status createdAt') // Select fields needed by ProductCard
            .populate<{ user: PopulatedUser }>('user', 'name avatar') // Populate user name/avatar
            .sort({ createdAt: -1 })
            .lean<PopulatedDoc[]>();

        return listings.map(listing => ({
            id: listing._id.toString(),
            title: listing.title,
            user: { // User who posted
                id: listing.user._id.toString(),
                name: listing.user.name ?? 'Unknown User', // Provide default
                avatar: listing.user.avatar,
            },
            description: listing.description,
            image: listing.image,
            // status: listing.status, // Uncomment if needed
            // createdAt: listing.createdAt, // Uncomment if needed
        }));
    } catch (error) {
        console.error(`[PROFILE PAGE] fetchPostedListings: Error for user ${userId}:`, error);
        return [];
    }
}

/**
 * Fetches listings received by the user via the Order model.
 * Returns empty array on error or if none found.
 */
async function fetchReceivedListings(userId: string): Promise<PopulatedListingCardData[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    try {
        await dbConnect();
        type PopulatedUser = { _id: Types.ObjectId; name: string; avatar?: string };
        // Ensure IListing includes user field typed correctly for population result
        type PopulatedListing = IListing & { _id: Types.ObjectId; user: PopulatedUser };
        type PopulatedOrderDoc = IOrder & { _id: Types.ObjectId; listing: PopulatedListing };

        const orders = await Order.find({ recipient: userId })
            .select('listing claimedAt') // Select needed fields from Order
            .populate<{ listing: PopulatedListing }>({ // Type hint for populate
                path: 'listing', // Populate the listing field
                select: 'title description image user status createdAt', // Select needed fields from Listing
                populate: { path: 'user', select: 'name avatar', model: User } // Nested populate user who posted
            })
            .sort({ claimedAt: -1 })
            .lean<PopulatedOrderDoc[]>(); // Apply type hint

        const mappedListings = orders.map(order => {
            if (!order.listing?._id || !order.listing.user?._id) { // Check required populated data
                console.warn(`[PROFILE PAGE] fetchReceivedListings: Order ${order._id} missing populated listing/user.`);
                return null;
            }
            const cardData: PopulatedListingCardData = {
                id: order.listing._id.toString(),
                title: order.listing.title,
                user: { // Original poster
                    id: order.listing.user._id.toString(),
                    name: order.listing.user.name ?? 'Original Lister',
                    avatar: order.listing.user.avatar,
                },
                description: order.listing.description,
                image: order.listing.image,
                // status: order.listing.status, // Uncomment if needed
                // createdAt: order.listing.createdAt, // Uncomment if needed
                // claimedAt: order.claimedAt, // Pass this if needed by ProductCard
            };
            return cardData;
        });

        return mappedListings.filter((item): item is PopulatedListingCardData => item !== null);

    } catch (error) {
        console.error(`[PROFILE PAGE] fetchReceivedListings: Error for user ${userId}:`, error);
        return [];
    }
}

/**
 * Retrieves the logged-in user's ID from the JWT token in cookies.
 * Returns null if token invalid, missing, expired, or secret not set.
 */
async function getLoggedInUserId(): Promise<string | null> {
    // ** FIX APPLIED HERE **
    const cookieStore = await cookies(); // Await the promise to get the cookie store object
    const tokenCookie = cookieStore.get('authToken'); // Call .get() on the resolved object

    if (!tokenCookie?.value) {
        // This is normal if user is not logged in, so don't log error
        // console.log("[AUTH] No auth token cookie found.");
        return null;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // This IS an error - should be logged prominently
        console.error("[AUTH] CRITICAL: JWT_SECRET environment variable is not set.");
        return null;
    }

    try {
        // Verify token and extract user ID from payload { user: { id: '...' } }
        const decoded = jwt.verify(tokenCookie.value, secret) as { user?: { id?: string } };
        return decoded?.user?.id || null;
    } catch (error) {
        // Log specific JWT errors for easier debugging
        if (error instanceof jwt.TokenExpiredError) {
             console.log("[AUTH] Auth token expired.");
        } else if (error instanceof jwt.JsonWebTokenError) {
             console.warn("[AUTH] Invalid auth token:", error.message);
        } else {
             console.error("[AUTH] Auth token verification failed:", error);
        }
        return null; // Return null on any verification error
    }
}


// --- Dynamic Profile Page Server Component ---

export default async function DynamicProfilePage({ params }: { params: { userId: string } }) {

    const profileUserId = params.userId;

    // 1. Validate requested user ID format
    if (!mongoose.Types.ObjectId.isValid(profileUserId)) {
        console.log(`[PROFILE PAGE] Invalid userId param format: ${profileUserId}`);
        notFound(); // Invalid ID format is a 404
    }

    // 2. Fetch all data concurrently
    // Note: A Suspense boundary could be used around ProfileTabs if loading listings is slow
    // and you want the header to render first.
    const [loggedInUserId, profileData, postedListings, receivedListings] = await Promise.all([
        getLoggedInUserId(),
        fetchUserProfile(profileUserId),
        fetchPostedListings(profileUserId),
        fetchReceivedListings(profileUserId)
    ]);

    // 3. Check if the profile user exists (essential data)
    if (!profileData) {
        console.log(`[PROFILE PAGE] Profile not found in DB for userId: ${profileUserId}`);
        notFound(); // User doesn't exist is a 404
    }

    // 4. Determine if the viewer owns this profile
    const isOwnProfile = loggedInUserId === profileData.id;

    // 5. Render the page
    return (
        // Using fragment as root unless a specific wrapper div is needed
        <>
            {/* Profile Header Section - Rendered on Server */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm mb-8">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/30 flex-shrink-0">
                    <AvatarImage src={profileData.avatar} alt={`${profileData.name}'s avatar`} />
                    <AvatarFallback className="text-3xl bg-muted">
                        {/* Generate initials */}
                        {profileData.name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-2 min-w-0"> {/* min-w-0 prevents flex item overflow */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h1 className="text-3xl font-bold truncate">{profileData.name}</h1>
                        {/* Show Edit button only on own profile */}
                        {isOwnProfile && (
                            // Use standard HTML link for navigation triggered from Server Component
                            <a href="/settings" className="inline-block flex-shrink-0">
                                <Button variant="outline" size="sm">
                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                </Button>
                            </a>
                        )}
                    </div>
                    {/* Conditionally render Rating */}
                    {(profileData.rating ?? 0) > 0 && ( // Use nullish coalescing for default check
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="font-semibold text-lg text-foreground">{profileData.rating?.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">(Rating)</span>
                        </div>
                    )}
                    {/* Display Description */}
                    <p className="text-muted-foreground text-base pt-1">
                        {profileData.description || "No description provided."}
                    </p>
                </div>
            </div>

            {/* Listing Tabs - Delegated to Client Component */}
            {/* Pass fetched data as props to the client component */}
            <ProfileTabs
                postedListings={postedListings}
                receivedListings={receivedListings}
            />
        </>
    );
}