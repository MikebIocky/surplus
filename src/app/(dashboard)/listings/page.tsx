// src/app/page.tsx
"use client" // Add back client directive since we need client-side interactivity

import React from 'react'; // Import React
import { ProductCard, ProductCardProps } from "@/components/ProductCard"; // Import ProductCard and its props type if available
import dbConnect from '@/lib/dbConnect'; // Import DB connection utility
import Listing, { IListing } from '@/models/Listing'; // Import Listing model and interface
import User, { IUser } from '@/models/User'; // Import User model if needed for typing populated fields
import mongoose, { Types } from 'mongoose'; // Import mongoose types
import { getMainImageUrl } from '@/lib/getMainImageUrl'; // Import getMainImageUrl utility
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from 'next/navigation';

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
    category: string; // Add category field
}

// --- Home Page Component ---
export default function HomePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || 'all';

    // Handle category change
    const handleCategoryChange = (value: string) => {
        const url = new URL(window.location.href);
        if (value === 'all') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', value);
        }
        router.push(url.toString());
    };

    // Fetch listings based on category
    const [listings, setListings] = React.useState<FetchedListingData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchListings() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/listings?category=${category}`);
                const data = await response.json();
                setListings(data);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchListings();
    }, [category]);

    // Group listings by category
    const listingsByCategory = listings.reduce((acc, listing) => {
        const category = listing.category || 'other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(listing);
        return acc;
    }, {} as Record<string, FetchedListingData[]>);

    // Convert to sections array
    const sections = Object.entries(listingsByCategory).map(([category, items]) => ({
        title: category.charAt(0).toUpperCase() + category.slice(1),
        items
    }));

    // Filter out sections that might be empty
    const sectionsToShow = sections.filter(({ items }) => items.length > 0);

    return (
        <div className="space-y-10 md:space-y-12 p-4 md:p-6 lg:p-8 max-w-full">
            {/* Category Filter */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold">Available Listings</h1>
                <Select
                    value={category}
                    onValueChange={handleCategoryChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="pantry">Pantry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">Loading listings...</p>
                </div>
            ) : sectionsToShow.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold text-muted-foreground">No available listings found right now.</h2>
                    <p className="text-muted-foreground mt-2">Why not be the first to share something?</p>
                </div>
            ) : (
                sectionsToShow.map(({ title, items }) => (
                    <section key={title}>
                        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-5 border-b pb-2">{title} ({items.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {items.map((item) => (
                                // Render ProductCard with data fetched from DB
                                <ProductCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    user={item.user}
                                    description={item.description}
                                    image={item.image}
                                    createdAt={item.createdAt ?? new Date()}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}