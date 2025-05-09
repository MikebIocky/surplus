// src/components/ProfileTabs.tsx
"use client"; // Make this a Client Component because Tabs uses state

import React from 'react';

// --- UI Imports ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { Package as PackageIcon, Archive as ArchiveIcon } from "lucide-react";

// --- Define the expected shape of listing data passed as props ---
// (This should match PopulatedListingData from the server component)
interface PopulatedListingData {
    id: string;
    title: string;
    user: { id: string; name: string; avatar?: string };
    description: string;
    image?: string;
    status?: string;
    createdAt?: Date;
}

interface ProfileTabsProps {
  postedListings: PopulatedListingData[];
  receivedListings: PopulatedListingData[];
}

export function ProfileTabs({ postedListings, receivedListings }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="posted" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
        <TabsTrigger value="posted" className="flex items-center gap-2">
          <PackageIcon className="w-4 h-4"/> Posted Listings ({postedListings.length})
        </TabsTrigger>
        <TabsTrigger value="received" className="flex items-center gap-2">
          <ArchiveIcon className="w-4 h-4" /> Received Listings ({receivedListings.length})
        </TabsTrigger>
      </TabsList>

      {/* Posted Listings Content */}
      <TabsContent value="posted" className="mt-6">
        {postedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {postedListings.map((item) => (
              <ProductCard
                key={`posted-${item.id}`}
                id={item.id}
                title={item.title}
                user={item.user}
                description={item.description}
                image={item.image}
                // Pass other props if ProductCard expects them (status, createdAt)
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10 border rounded-md">
            This user hasn&apos;t posted any listings yet.
          </div>
        )}
      </TabsContent>

      {/* Received Listings Content */}
      <TabsContent value="received" className="mt-6">
        {receivedListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {receivedListings.map((item) => (
              <ProductCard
                key={`received-${item.id}`}
                id={item.id}
                title={item.title}
                user={item.user} // Original lister
                description={item.description}
                image={item.image}
                 // Pass other props if ProductCard expects them
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10 border rounded-md">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t received any items yet.
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}