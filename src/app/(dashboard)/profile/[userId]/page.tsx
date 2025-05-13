// src/app/(dashboard)/profile/[userId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers'; // Core Next.js function for server-side cookie access
import jwt from 'jsonwebtoken'; // For verifying JWT tokens
import mongoose, { Types } from 'mongoose'; // For ObjectId validation and types
import { jwtVerify } from 'jose';

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
import { Edit, Star, MessageCircle } from "lucide-react";
import { ProfileTabs } from '@/components/ProfileTabs'; // Ensure this Client Component exists
import Link from 'next/link';
import FollowButton from '@/components/FollowButton';

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
    user: CardUserData;
    description: string;
    image: string;
    status?: string;
    createdAt?: Date;
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
            .select('title description images user status createdAt')
            .populate<{ user: PopulatedUser }>('user', 'name avatar')
            .sort({ createdAt: -1 })
            .lean<PopulatedDoc[]>();

        return listings.map(listing => ({
            id: listing._id.toString(),
            title: listing.title,
            user: {
                id: listing.user._id.toString(),
                name: listing.user.name ?? 'Unknown User',
                avatar: listing.user.avatar,
            },
            description: listing.description,
            image: listing.images?.[0]?.url, // Take first image URL if available
            status: listing.status,
            createdAt: listing.createdAt,
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
        type PopulatedListing = IListing & { _id: Types.ObjectId; user: PopulatedUser };
        type PopulatedOrderDoc = IOrder & { _id: Types.ObjectId; listing: PopulatedListing };

        const orders = await Order.find({ recipient: userId })
            .select('listing claimedAt')
            .populate<{ listing: PopulatedListing }>({
                path: 'listing',
                select: 'title description images user status createdAt',
                populate: { path: 'user', select: 'name avatar', model: User }
            })
            .sort({ claimedAt: -1 })
            .lean<PopulatedOrderDoc[]>();

        const mappedListings = orders.map(order => {
            if (!order.listing?._id || !order.listing.user?._id) {
                console.warn(`[PROFILE PAGE] fetchReceivedListings: Order ${order._id} missing populated listing/user.`);
                return null;
            }
            const cardData: PopulatedListingCardData = {
                id: order.listing._id.toString(),
                title: order.listing.title,
                user: {
                    id: order.listing.user._id.toString(),
                    name: order.listing.user.name ?? 'Original Lister',
                    avatar: order.listing.user.avatar,
                },
                description: order.listing.description,
                image: order.listing.images?.[0]?.url, // Take first image URL if available
                status: order.listing.status,
                createdAt: order.listing.createdAt,
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
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    console.log('TOKEN:', token);
    if (!token) {
        // This is normal if user is not logged in, so don't log error
        // console.log("[AUTH] No auth token cookie found.");
        return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    try {
        const { payload } = await jwtVerify(token, secret);
        return (payload as { user?: { id?: string } }).user?.id as string;
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

// Add this function after getLoggedInUserId
async function checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followingId)) {
        return false;
    }
    try {
        await dbConnect();
        const user = await User.findById(followerId).select('following').lean();
        return user?.following?.some((id: Types.ObjectId) => id.toString() === followingId) ?? false;
    } catch (error) {
        console.error(`[PROFILE PAGE] checkIfFollowing: Error checking follow status:`, error);
        return false;
    }
}

// --- Dynamic Profile Page Server Component ---

export default async function DynamicProfilePage(props: {
    params: Promise<{ userId: string }>;
}) {
    const params = await props.params;
    const { userId } = params;
    const loggedInUserId = await getLoggedInUserId();
    const isOwnProfile = loggedInUserId === userId;
    const isFollowing = loggedInUserId ? await checkIfFollowing(loggedInUserId, userId) : false;

    const [profileData, postedListings, receivedListings] = await Promise.all([
        fetchUserProfile(userId),
        fetchPostedListings(userId),
        fetchReceivedListings(userId)
    ]);

    if (!profileData) {
        notFound();
    }

    return (
        <div className="container max-w-6xl mx-auto py-8">
            {/* Profile Header */}
            <div className="flex items-start gap-6 mb-8">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback className="text-2xl">
                        {profileData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                        <h1 className="text-2xl font-bold">{profileData.name}</h1>
                        {profileData.rating && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <Star className="h-4 w-4 fill-current" />
                                <span>{profileData.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>
                    {profileData.description && (
                        <p className="text-muted-foreground mb-4">{profileData.description}</p>
                    )}
                    <div className="flex gap-2">
                        {isOwnProfile ? (
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/settings">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/messages/${userId}`}>
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Message
                                    </Link>
                                </Button>
                                <FollowButton userId={userId} initialIsFollowing={isFollowing} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Tabs */}
            <ProfileTabs
                postedListings={postedListings}
                receivedListings={receivedListings}
            />
        </div>
    );
}