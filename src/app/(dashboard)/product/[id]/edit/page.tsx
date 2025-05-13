import React from 'react';
import { notFound, redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { getUserIdFromCookieServer } from '@/lib/authUtils';
import { fetchListingDetails } from '@/lib/dataFetch';
import EditForm from './EditForm';

// Force dynamic rendering and no caching
export const dynamic = 'force-dynamic';

// Server Component to fetch data and authorize
export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const listingId = params.id;

  // 1. Validate ID format
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    console.log(`[EDIT PAGE] Invalid listingId format: ${listingId}`);
    notFound();
  }

  // 2. Fetch listing data and logged-in user concurrently
  const [loggedInUserId, listingData] = await Promise.all([
    getUserIdFromCookieServer(),
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
  const listing = {
    _id: listingData.id,
    title: listingData.title,
    description: listingData.description,
    quantity: listingData.details.quantity || '',
    location: listingData.details.location || '',
    images: listingData.image ? [{ url: listingData.image, publicId: listingData.imagePublicId || '' }] : [],
    expiryDate: listingData.details.expiryDate ? new Date(listingData.details.expiryDate).toISOString().split('T')[0] : null,
    contact: listingData.details.contact || null
  };

  return <EditForm listing={listing} />;
}