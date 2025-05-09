// src/app/following/page.tsx
"use client"; // Needed for onClick handlers on buttons and event propagation

import React from 'react';
import Link from 'next/link'; // Import Link for navigation
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card"; // Removed CardHeader/Title as they weren't used
import { UserMinus, MapPin, Package } from "lucide-react"; // Icons

// Mock data for followed users - replace with actual data fetching
const followedUsers = [
  {
    id: "user1",
    name: "Alice Green",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?&w=128&h=128&fit=facearea&q=80",
    location: "New York, NY",
    itemsListed: 12,
  },
  {
    id: "user2",
    name: "Bob The Builder",
    avatar: undefined,
    location: "San Francisco, CA",
    itemsListed: 5,
  },
  {
    id: "user3",
    name: "Clara Cook",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?&w=128&h=128&fit=facearea&q=80",
    location: "Austin, TX",
    itemsListed: 25,
  },
  {
    id: "user4",
    name: "Dave Planter",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?&w=128&h=128&fit=facearea&q=80",
    location: "Miami, FL",
    itemsListed: 8,
  },
  // Add more followed users...
];

// --- Updated handleUnfollow to accept event and stop propagation ---
const handleUnfollow = (event: React.MouseEvent<HTMLButtonElement>, userId: string, userName: string) => {
  event.stopPropagation(); // Prevent the click from triggering the Link navigation
  console.log(`Attempting to unfollow user: ${userName} (ID: ${userId})`);
  // Add actual unfollow logic here (e.g., API call, state update)
  alert(`Unfollow action triggered for ${userName}. Implement actual logic.`);
  // Consider updating the UI optimistically or after confirmation
};

export default function FollowingPage() {

  // Handle empty state
  if (followedUsers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        You are not following anyone yet. Explore listings to find users!
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Following</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {followedUsers.map((user) => (
          // --- Wrap the Card with Link component ---
          <Link
             key={user.id}
             href={`/profile/${user.id}`} // Dynamic href to the user's profile
             passHref // Recommended for custom components like Card
             className="block transition-transform duration-200 hover:-translate-y-1" // Added subtle hover effect to link
          >
            {/* Apply focus styles to the card when the link wrapper is focused */}
            <Card className="flex flex-col text-center h-full shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {/* Card Content remains the same */}
              <CardContent className="flex flex-col items-center pt-6 flex-grow">
                <Avatar className="w-20 h-20 mb-4 border-2 border-primary/20">
                  <AvatarImage src={user.avatar} alt={`${user.name}'s avatar`} />
                  <AvatarFallback className="text-xl bg-muted">
                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg text-foreground">{user.name}</h3>
                 {user.location && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" /> {user.location}
                    </p>
                 )}
                 <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <Package className="w-3 h-3" /> {user.itemsListed} items listed
                 </p>
              </CardContent>

              {/* Footer with action button */}
              <CardFooter className="flex justify-center pt-4 pb-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  // --- Update onClick to pass event ---
                  onClick={(e) => handleUnfollow(e, user.id, user.name)}
                  className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive z-10" // Added z-10 just in case
                  aria-label={`Unfollow ${user.name}`} // Better accessibility
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Unfollow
                </Button>
                {/* Removed the commented out Link button as the card is the link */}
              </CardFooter>
            </Card>
          </Link> // End Link wrapper
        ))}
      </div>
    </div>
  );
}