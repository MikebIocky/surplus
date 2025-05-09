// src/components/UserProfileDisplay.tsx
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { UserPlus, UserMinus, Star, Package as PackageIcon } from "lucide-react";
import FollowButton from './FollowButton';

// --- Types for Props ---
type User = {
    id: string;
    name: string;
    avatar?: string;
    email: string;
    description?: string;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
};

type Product = {
    id: string;
    title: string;
    user: User; // User who listed the item
    description?: string;
    image?: string;
    createdAt: Date;
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
    user: User;
    isFollowing?: boolean;
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

export function UserProfileDisplay({ user, isFollowing = false }: UserProfileDisplayProps) {
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle>{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
            </CardHeader>
            <CardContent>
                {user.description && (
                    <p className="text-sm text-muted-foreground">{user.description}</p>
                )}
                {user.rating !== undefined && (
                    <div className="mt-2">
                        <span className="text-sm font-medium">Rating: </span>
                        <span className="text-sm text-muted-foreground">{user.rating.toFixed(1)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}