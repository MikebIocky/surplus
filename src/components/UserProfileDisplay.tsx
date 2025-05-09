// src/components/UserProfileDisplay.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // No header/title needed directly here maybe
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { UserPlus, UserMinus, Star, Package as PackageIcon } from "lucide-react";

// --- Types for Props ---
type User = {
    id: string;
    name: string;
    avatar?: string;
};

type Product = {
    id: string;
    title: string;
    user: User; // User who listed the item
    description?: string;
    image?: string;
};

type UserProfileData = {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    description?: string;
    postedListings: Product[]; // Listings posted BY THIS user
};

interface UserProfileDisplayProps {
    profile: UserProfileData;
    initialIsFollowing: boolean;
    loggedInUserId: string; // ID of the user viewing the page
}

// --- Mock API Call Functions (Replace with actual API calls) ---
async function followUserApi(targetUserId: string): Promise<boolean> {
    console.log(`API CALL: Following user ${targetUserId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Assume success for mock
    return true;
}

async function unfollowUserApi(targetUserId: string): Promise<boolean> {
    console.log(`API CALL: Unfollowing user ${targetUserId}`);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Assume success for mock
    return true;
}
// --- End Mock API Calls ---


export function UserProfileDisplay({ profile, initialIsFollowing, loggedInUserId }: UserProfileDisplayProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false); // Loading state for button

    // Don't show follow/unfollow button on own profile
    const isOwnProfile = profile.id === loggedInUserId;

    const handleFollowToggle = async () => {
        if (isOwnProfile || isLoading) return; // Prevent action on own profile or while loading

        setIsLoading(true);
        try {
            let success = false;
            if (isFollowing) {
                success = await unfollowUserApi(profile.id);
                if (success) {
                    setIsFollowing(false);
                }
            } else {
                success = await followUserApi(profile.id);
                if (success) {
                    setIsFollowing(true);
                }
            }
            if (!success) {
              console.error("Follow/Unfollow API call failed");
              // Optionally revert state or show error message
            }
        } catch (error) {
            console.error("Error during follow/unfollow:", error);
            // Handle error, maybe show a toast notification
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl">
            {/* Profile Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 md:p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary/30">
                    <AvatarImage src={profile.avatar} alt={`${profile.name}'s avatar`} />
                    <AvatarFallback className="text-3xl bg-muted">
                        {profile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h1 className="text-3xl font-bold">{profile.name}</h1>
                        {/* Conditional Follow/Unfollow Button */}
                        {!isOwnProfile && (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                size="sm"
                                onClick={handleFollowToggle}
                                disabled={isLoading}
                                className={isFollowing ? "text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" : ""}
                            >
                                {isLoading ? (
                                    <span>Processing...</span> // Simple loading text
                                ) : isFollowing ? (
                                    <>
                                        <UserMinus className="mr-2 h-4 w-4" /> Unfollow
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" /> Follow
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-semibold text-lg text-foreground">{profile.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">(Rating)</span>
                    </div>
                    {/* Description */}
                    <p className="text-muted-foreground text-base pt-1">
                        {profile.description || "No description provided."}
                    </p>
                </div>
            </div>

            {/* Tabs for Listings */}
            {/* Only showing posted listings for other users usually makes sense */}
             <Tabs defaultValue="posted" className="w-full">
                <TabsList className="inline-flex">
                    <TabsTrigger value="posted" className="flex items-center gap-2">
                        <PackageIcon className="w-4 h-4"/> Listings ({profile.postedListings.length})
                    </TabsTrigger>
                    {/* Optionally add other relevant tabs like 'Reviews' */}
                </TabsList>

                <TabsContent value="posted" className="mt-6">
                {profile.postedListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {profile.postedListings.map((item) => (
                        <ProductCard
                            key={`posted-${item.id}`}
                            id={item.id}
                            title={item.title}
                            user={item.user} // User who posted (which is profile.name here)
                            description={item.description}
                            image={item.image}
                        />
                        ))}
                    </div>
                    ) : (
                    <div className="text-center text-muted-foreground py-10 border rounded-md">
                        {profile.name} hasn't posted any listings yet.
                    </div>
                    )}
                </TabsContent>
             </Tabs>
        </div>
    );
}