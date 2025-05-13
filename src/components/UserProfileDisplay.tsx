// src/components/UserProfileDisplay.tsx
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface UserProfileDisplayProps {
    user: User;
    isFollowing?: boolean;
}

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