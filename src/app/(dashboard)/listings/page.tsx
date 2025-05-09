// src/app/page.tsx
// Remove "use client" - This should be a Server Component to fetch data

import React from 'react'; // Import React
import { ProductCard, ProductCardProps } from "@/components/ProductCard"; // Import ProductCard and its props type if available
import dbConnect from '@/lib/dbConnect'; // Import DB connection utility
import Listing, { IListing } from '@/models/Listing'; // Import Listing model and interface
import User, { IUser } from '@/models/User'; // Import User model if needed for typing populated fields
import mongoose, { Types } from 'mongoose'; // Import mongoose types

// --- Type Definitions ---

// Define the specific structure expected by ProductCard's user prop
interface CardUserData {
  id: string;
  name: string;
  avatar?: string;
}

// Define the structure of listing data after fetching and population
// This should match the props required by ProductCard
interface FetchedListingData {
    id: string;
    title: string;
    user: CardUserData;
    description: string; // Assuming ProductCard needs description
    image?: string;
    createdAt?: Date; // Optional: for sorting or display
    // Add other fields ProductCard might need, like status
}

// --- Server-Side Data Fetching Function ---

/**
 * Fetches available listings from the database, sorted by creation date.
 * Populates basic user information needed for the ProductCard.
 */
async function fetchAllAvailableListings(limit: number = 20): Promise<FetchedListingData[]> {
    console.log("[HOME PAGE] Attempting to fetch listings...");
    try {
        await dbConnect(); // Ensure DB connection

        // Define types for populated result
        type PopulatedUser = Pick<IUser, 'name' | 'avatar'> & { _id: Types.ObjectId };
        // Define the shape of the document returned by lean, including populated user
        type PopulatedListingDoc =
            Pick<IListing, 'title' | 'description' | 'image' | 'createdAt' | 'status'> // Select needed fields
            & { _id: Types.ObjectId; user: PopulatedUser }; // Add _id and populated user type

        const listings = await Listing.find({ status: 'available' }) // Fetch only 'available' listings
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(limit) // Limit the number of results
            .populate<{ user: PopulatedUser }>('user', 'name avatar') // Populate required user fields
            .select('title description image user createdAt status') // Select fields to return
            .lean<PopulatedListingDoc[]>(); // Use lean with type hint

        console.log(`[HOME PAGE] Found ${listings.length} available listings.`);

        // Map the database documents to the structure needed by ProductCard
        return listings.map(listing => {
            // Ensure user population happened correctly
            const userExists = !!listing.user?._id;
            return {
                id: listing._id.toString(),
                title: listing.title,
                user: {
                    id: userExists ? listing.user._id.toString() : '',
                    name: userExists ? listing.user.name ?? 'Unknown User' : 'Unknown User',
                    avatar: userExists ? listing.user.avatar : undefined,
                },
                description: listing.description,
                image: listing.image,
                createdAt: listing.createdAt, // Include if needed
                // status: listing.status, // Include if needed
            };
        });

    } catch (error) {
        console.error("[HOME PAGE] Error fetching listings:", error);
        return []; // Return an empty array on error
    }
}

// --- Home Page Server Component ---
export default async function HomePage() {

  // Fetch all available listings when the page renders on the server
  const allListings: FetchedListingData[] = await fetchAllAvailableListings(20); // Fetch up to 20 listings

  // --- Basic Grouping (Example - replace with real logic later) ---
  // For now, just display all fetched listings under one section.
  // Real sections like "For you", "Near you" require more complex logic/data.
  const sections = {
      "Available Listings": allListings,
      // Future sections would be populated based on different fetch logic
      // "Near You": await fetchNearbyListings(userLocation, 8),
      // "For You": await fetchPersonalizedListings(userId, 8),
  };

  // Filter out sections that might be empty
  const sectionsToShow = Object.entries(sections).filter(([_, items]) => items.length > 0);

  return (
    // Add padding for better spacing
    <div className="space-y-10 md:space-y-12 p-4 md:p-6 lg:p-8 max-w-full"> {/* Use max-w-full or specific container */}

      {sectionsToShow.length === 0 ? (
          // --- Display if no listings are found ---
         <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-muted-foreground">No available listings found right now.</h2>
            <p className="text-muted-foreground mt-2">Why not be the first to share something?</p>
            {/* Optional: Link to create page */}
            {/* <Button asChild className="mt-4"><Link href="/create">Create a Listing</Link></Button> */}
         </div>
      ) : (
          // --- Display listings grouped by section ---
          sectionsToShow.map(([sectionTitle, items]) => (
            <section key={sectionTitle}>
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-5 border-b pb-2">{sectionTitle} ({items.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {items.map((item) => (
                  // Render ProductCard with data fetched from DB
                  <ProductCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    user={item.user} // Pass populated user data
                    description={item.description} // Pass description
                    image={item.image}
                    // Pass any other props ProductCard requires (like createdAt or status)
                  />
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}