// src/app/history/page.tsx
"use client"; // Required for useState, useEffect, localStorage access

import React, { useState, useEffect } from 'react';
import { ProductCard, ProductCardProps } from "@/components/ProductCard"; // Adjust path
import { Loader2 } from 'lucide-react'; // For loading indicator

// Define the structure expected from localStorage
interface ViewedItem {
    id: string;
    title: string;
    image?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    viewedAt: number;
}

// Key for localStorage
const VIEWED_HISTORY_KEY = 'viewedListingsHistory';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<ViewedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading

  // Effect to load history from localStorage on component mount
  useEffect(() => {
    setIsLoading(true);
    console.log("HistoryPage: Attempting to load history from localStorage.");
    try {
      if (typeof window !== 'undefined') {
        const storedHistoryRaw = localStorage.getItem(VIEWED_HISTORY_KEY);
        if (storedHistoryRaw) {
          const parsedHistory = JSON.parse(storedHistoryRaw) as ViewedItem[];
          // Optional: Validate parsed data shape here
          setHistoryItems(parsedHistory);
          console.log(`HistoryPage: Loaded ${parsedHistory.length} items.`);
        } else {
          console.log("HistoryPage: No history found in localStorage.");
          setHistoryItems([]); // Ensure empty array if nothing stored
        }
      }
    } catch (error) {
      console.error("HistoryPage: Failed to load or parse history:", error);
      setHistoryItems([]); // Set empty on error
    } finally {
      setIsLoading(false); // Finish loading
    }
  }, []); // Empty dependency array ensures it runs only once on mount

  // Function to clear history (optional)
  const clearHistory = () => {
     if (typeof window !== 'undefined') {
          if(confirm("Are you sure you want to clear your viewing history? This cannot be undone.")) {
              localStorage.removeItem(VIEWED_HISTORY_KEY);
              setHistoryItems([]);
              console.log("HistoryPage: History cleared.");
          }
     }
  };

  // --- Render Logic ---

  if (isLoading) {
    // Show loader while reading localStorage
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (historyItems.length === 0) {
    // Show empty state message after loading
    return (
      <div className="text-center text-muted-foreground py-16 px-4">
        <h2 className="text-xl font-semibold mb-2">No Viewing History Yet</h2>
        <p>Items you view will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <section>
        <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold">Viewed Listings</h2>
             {/* Optional: Clear History Button */}
             <button
                onClick={clearHistory}
                className="text-sm text-destructive hover:underline"
             >
                Clear History
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {historyItems.map((item) => {
            // Map the stored data to the props ProductCard expects
            const cardProps: ProductCardProps = {
                id: item.id,
                title: item.title,
                // Reconstruct the user object ProductCard expects
                user: {
                    id: item.userId,
                    name: item.userName,
                    avatar: item.userAvatar,
                },
                // Description is not stored, pass empty or default
                description: "(Viewed Listing)", // Add placeholder description
                image: item.image,
            };
            return <ProductCard key={`history-${item.id}`} {...cardProps} />;
          })}
        </div>
      </section>
    </div>
  );
}