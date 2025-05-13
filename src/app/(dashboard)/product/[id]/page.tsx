// src/app/(dashboard)/product/[id]/page.tsx

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Import directly
import { jwtVerify, JWTPayload } from 'jose'; // Use jose
import mongoose from 'mongoose';

// --- Data Fetching & Types ---
import {
    fetchListingDetails,
    fetchRecommendedListings,
} from "@/lib/dataFetch";

// --- UI Components ---
import { ProductDetail, ProductDetailProps } from "@/components/ProductDetail"; // Import props type too

// --- Server Component Configuration ---
export const dynamic = 'force-dynamic'; // Ensure fresh data

// --- Authentication Helper (Corrected cookie access) ---
/**
 * Retrieves the logged-in user's ID from the JWT token in cookies.
 */
async function getUserIdFromCookieServer(): Promise<string | null> {
    // Access cookies *inside* the async function
    const cookieStore = await cookies(); // Get cookie store object first
    const tokenCookie = cookieStore.get('authToken'); // Call .get() on the object

    if (!tokenCookie?.value) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) { console.error("[ProductPage AUTH] JWT_SECRET missing."); return null; }

    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(tokenCookie.value, secretKey) as { payload: JWTPayload & { user?: { id?: string } } };
        return payload?.user?.id || null;
    } catch (error) {
        console.warn("[ProductPage AUTH] Token verification failed:", error instanceof Error ? error.message : error);
        return null;
    }
}

// Helper to validate and convert status
function convertStatus(status: string | undefined): "Available" | "Picking Up" | "Unavailable" {
    if (!status) return "Unavailable";
    const normalized = status.toLowerCase();
    if (normalized === "available") return "Available";
    if (normalized === "picking up" || normalized === "claimed") return "Picking Up";
    return "Unavailable";
}

// --- Page Component ---
export default async function ProductPage({ params }: { params: { id: string } }) {
    // 1. Get user ID from cookie
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
        redirect('/log-in');
    }

    // 2. Validate product ID format
    const productId = params.id;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        notFound();
    }

    // 3. Fetch listing details
    console.log('[FETCH LISTING DETAILS] Fetching details for listing ID:', productId);
    const listingData = await fetchListingDetails(productId);
    if (!listingData) {
        notFound();
    }
    console.log('[FETCH LISTING DETAILS] Successfully fetched and mapped data for listing ID:', productId);

    // 4. Fetch recommended items
    console.log('[FETCH RECOMMENDED] Fetching recommendations for user', userId, 'excluding', productId);
    const recommendedItemsRaw = await fetchRecommendedListings(userId, productId);
    const recommendedItems = recommendedItemsRaw.map(item => ({
        ...item,
        description: 'No description available'
    }));
    console.log('[FETCH RECOMMENDED] Found', recommendedItems.length, 'recommendations.');

    // 5. Check if current user is the owner
    const isOwner = listingData.user.id === userId;
    console.log('[ProductPage] Viewing listing', productId + '. isOwner =', isOwner, '(Viewer:', userId, ', Poster:', listingData.user.id + ')');

    // 6. Convert status to the correct type
    const status = convertStatus(listingData.status);

    return (
        <div className="container mx-auto px-4 py-8">
            <ProductDetail
                {...listingData}
                status={status}
                recommended={recommendedItems}
                isOwner={isOwner}
            />
        </div>
    );
}