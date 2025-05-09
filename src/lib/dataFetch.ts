// src/lib/dataFetch.ts

import dbConnect from '@/lib/dbConnect';        // Database connection utility
import Listing, { IListing } from '@/models/Listing'; // Listing model and TS interface
import User, { IUser } from '@/models/User';        // User model and TS interface
import mongoose, { Types } from 'mongoose';       // Mongoose for ObjectId validation and types
import { getMainImageUrl } from '@/lib/getMainImageUrl';

// --- Type Definitions ---

// Structure for user data displayed on the Product Detail page header
interface ProductDetailUserData {
  id: string;
  name: string;
  avatar?: string; // Optional avatar URL
  rating?: number; // Optional user rating
}

// Structure for specific listing details displayed within the Product Detail page
// These should correspond to fields on the Listing model/schema
interface ListingSpecificDetails {
  quantity?: string;         // e.g., "1 bunch", "500g"
  expiryDate?: string | Date; // Stored as Date, formatted as string for display
  location?: string;         // General location description
  contact?: string;          // Optional contact info
}

// The primary data structure returned by fetchListingDetails
// Combines listing info, populated user, and structured details
// Also includes imagePublicId if needed for editing/deletion flows
export interface ProductPageData {
    id: string;                // Listing ID
    title: string;             // Listing title
    user: ProductDetailUserData; // Populated user who posted
    status?: IListing['status'] | string; // Status from the enum or string
    image?: string;             // Main image URL
    imagePublicId?: string;     // Cloudinary (or other) ID for the image (optional)
    description: string;         // Main listing description
    details: ListingSpecificDetails; // Nested object for specific details
    createdAt?: Date;          // Optional: if needed for display
}

// Simplified data structure for recommended listing cards
export interface RecommendedItemData {
    id: string;
    title: string;
    image?: string;
    user: { id: string; name: string; avatar?: string; }; // Basic user info
    // Add description if ProductCard used for recommendations needs it
    // description?: string;
}


/**
 * Fetches complete details for a single listing by its ID.
 * Populates user data (name, avatar, rating).
 * Includes fields necessary for both display and editing (like imagePublicId).
 * Returns structured data matching ProductPageData or null if not found/error.
 */
export async function fetchListingDetails(listingId: string): Promise<ProductPageData | null> {
    // 1. Validate Input ID Format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
        console.warn(`[FETCH LISTING DETAILS] Invalid listingId format provided: ${listingId}`);
        return null;
    }

    try {
        // 2. Connect to Database
        await dbConnect();
        console.log(`[FETCH LISTING DETAILS] Fetching details for listing ID: ${listingId}`);

        // 3. Define Types for Populated Result more accurately
        // Type for the populated user object based on .populate() selection
        type PopulatedUser = Pick<IUser, 'name' | 'avatar' | 'rating'> & { _id: Types.ObjectId };

        // Type for the lean document, including selected IListing fields AND the populated user
        // IMPORTANT: Assumes IListing includes all selected fields (title, desc, image, status, quantity, etc.)
        type PopulatedListingDoc =
             Pick<IListing, 'title' | 'description' | 'images' | 'status' | 'quantity' | 'expiryDate' | 'location' | 'contact' | 'createdAt'>
             & { _id: Types.ObjectId; user: PopulatedUser }; // Combine selected fields with _id and populated user

        // 4. Fetch Listing from Database using Mongoose
        const listing = await Listing.findById(listingId)
            .populate<{ user: PopulatedUser }>('user', 'name avatar rating') // Populate specified user fields
            // Select ALL fields needed from the Listing model for display and editing prep
            .select('title description images status user quantity expiryDate location contact createdAt')
            .lean<PopulatedListingDoc>(); // Use lean() with the specific type hint

        // 5. Handle Not Found or Population Failure
        if (!listing) {
             console.log(`[FETCH LISTING DETAILS] Listing not found in DB for ID: ${listingId}`);
             return null;
        }
        if (!listing.user?._id) { // Check if the required user population worked
             console.warn(`[FETCH LISTING DETAILS] Critical: User could not be populated for listing ID: ${listingId}. Listing data might be corrupt.`);
             // Returning null as essential user info is missing
             return null;
        }

        // 6. Map the fetched DB document to the target ProductPageData structure
        const productData: ProductPageData = {
            id: listing._id.toString(),
            title: listing.title,
            user: { // Map populated user data
                id: listing.user._id.toString(),
                name: listing.user.name ?? 'Unknown User', // Provide default if name somehow missing
                avatar: listing.user.avatar,
                rating: listing.user.rating, // Include rating from populated user
            },
            status: listing.status, // Pass status directly
            image: getMainImageUrl(listing.images),
            description: listing.description,
            details: { // Map relevant fields into the nested 'details' object
                quantity: listing.quantity,
                // Keep expiryDate as Date object if present, otherwise pass string/undefined
                expiryDate: listing.expiryDate,
                location: listing.location,
                contact: listing.contact,
            },
            createdAt: listing.createdAt, // Include createdAt if needed
        };
        console.log(`[FETCH LISTING DETAILS] Successfully fetched and mapped data for listing ID: ${listingId}`);
        return productData;

    } catch (error) {
        console.error(`[FETCH LISTING DETAILS] Database/processing error for listing ${listingId}:`, error);
        return null; // Return null on any unexpected error
    }
}

/**
 * Fetches recommended/related listings (e.g., other available items by the same user).
 * Returns an array matching RecommendedItemData structure, limited by 'limit'.
 */
export async function fetchRecommendedListings(
    currentListingId: string, // ID of the listing currently being viewed (to exclude)
    userIdOfPoster: string,   // ID of the user who posted the main listing
    limit: number = 4          // Max number of recommendations to fetch
 ): Promise<RecommendedItemData[]> {
     // 1. Validate Input IDs
     if (!mongoose.Types.ObjectId.isValid(userIdOfPoster) || !mongoose.Types.ObjectId.isValid(currentListingId)) {
         console.warn("[FETCH RECOMMENDED] Invalid userId or currentListingId format provided.");
         return []; // Return empty if IDs invalid
     }
     try {
         // 2. Connect to Database
         await dbConnect();
         console.log(`[FETCH RECOMMENDED] Fetching recommendations for user ${userIdOfPoster}, excluding ${currentListingId}`);

         // 3. Define Types for Populated Result
         type PopulatedUser = Pick<IUser, 'name' | 'avatar'> & { _id: Types.ObjectId };
         // Select only title, image from Listing for the recommended card + _id and populated user
         type PopulatedListingDoc = Pick<IListing, 'title' | 'images'> & { _id: Types.ObjectId; user: PopulatedUser };

         // 4. Fetch Listings from Database
         const listings = await Listing.find({
             user: userIdOfPoster,          // Match the user who posted the original item
             _id: { $ne: currentListingId }, // Exclude the item currently being viewed
             status: 'available'            // Only recommend items that are available
         })
         .limit(limit)                  // Apply the limit
         .sort({ createdAt: -1 })       // Sort newest first (or adjust sorting logic)
         .populate<{ user: PopulatedUser }>('user', 'name avatar') // Populate basic user info
         .select('title images user')    // Select only fields needed for the recommendation card
         .lean<PopulatedListingDoc[]>(); // Use lean with type hint

         console.log(`[FETCH RECOMMENDED] Found ${listings.length} recommendations.`);

         // 5. Map DB documents to the RecommendedItemData structure
         return listings.map(listing => ({
             id: listing._id.toString(),
             title: listing.title,
             image: getMainImageUrl(listing.images),
             user: {
                 id: listing.user._id.toString(),
                 name: listing.user.name ?? 'Unknown User',
                 avatar: listing.user.avatar,
             }
         }));

     } catch (error) {
         console.error(`[FETCH RECOMMENDED] Database/processing error for recommendations:`, error);
         return []; // Return empty array on any unexpected error
     }
}
