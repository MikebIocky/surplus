// src/app/product/[id]/edit/page.tsx

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import mongoose from 'mongoose';
// --- CORRECTED IMPORT ---
import { getUserIdFromCookieServer } from '@/lib/authUtils'; // Use the correct exported name
import { fetchListingDetails, ProductPageData } from '@/lib/dataFetch';
import EditListingForm from './EditListingForm';

// Force dynamic rendering and no caching
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// --- REMOVE any local redefinition of getLoggedInUserIdServer here ---
// async function getLoggedInUserIdServer(): Promise<string | null> { ... DO NOT REDEFINE HERE ... }

// Server Component to fetch data and authorize
export default async function EditProductPage({ params }: PageProps) {
    const listingId = params.id;

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
        console.log(`[EDIT PAGE] Invalid listingId format: ${listingId}`);
        notFound();
    }

    // 2. Fetch listing data and logged-in user concurrently
    // --- USE CORRECT IMPORTED FUNCTION NAME ---
    const [loggedInUserId, listingData] = await Promise.all([
        getUserIdFromCookieServer(), // Call the correctly imported function
        fetchListingDetails(listingId)
    ]);

    // 3. Handle Listing Not Found
    if (!listingData) {
        console.log(`[EDIT PAGE] Listing not found for ID: ${listingId}`);
        notFound();
    }

    // 4. Authorization Check: Ensure logged-in user is the owner
    if (!loggedInUserId || loggedInUserId !== listingData.user.id) {
        console.warn(`[EDIT PAGE] Unauthorized attempt to edit listing ${listingId} by user ${loggedInUserId}`);
        redirect(`/product/${listingId}?error=unauthorized`);
    }

    // 5. Pass data to the Client Component Form
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl md:text-3xl font-bold border-b pb-3 mb-6">
                Edit Listing: <span className="font-medium">{listingData.title}</span> {/* Use title */}
            </h1>
            <EditListingForm listing={{
                _id: listingData.id,
                title: listingData.title,
                description: listingData.description,
                quantity: listingData.details.quantity || '',
                location: listingData.details.location || '',
                images: listingData.image ? [{ url: listingData.image, publicId: listingData.imagePublicId || '' }] : [],
                expiryDate: listingData.details.expiryDate ? new Date(listingData.details.expiryDate).toISOString().split('T')[0] : null,
                contact: listingData.details.contact || null
            }} />
        </div>
    );
}