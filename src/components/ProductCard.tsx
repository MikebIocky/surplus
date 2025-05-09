// src/components/ProductCard.tsx
"use client"; // Must be a client component for onClick and localStorage

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // If displaying status
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from "date-fns";
import { Clock, MapPin } from "lucide-react";

// Props expected by the card
interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  location?: string;
}

// Define the structure for storing viewed items
interface ViewedItem {
    id: string;
    title: string;
    image?: string;
    userId: string; // ID of the user who posted
    userName: string;
    userAvatar?: string;
    viewedAt: number; // Timestamp of when it was viewed
}

const VIEWED_HISTORY_KEY = 'viewedListingsHistory';
const MAX_HISTORY_ITEMS = 50; // Limit how many items to store

export function ProductCard({
  id,
  title,
  description,
  image,
  createdAt,
  user,
  location,
}: ProductCardProps) {

    const handleCardClick = () => {
        console.log(`ProductCard clicked: ${id}, ${title}`);
        try {
            if (typeof window !== 'undefined') {
                const now = Date.now();
                // Prepare the item data to store
                const viewedItem: ViewedItem = {
                    id,
                    title,
                    image,
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar,
                    viewedAt: now,
                };

                // Get existing history or initialize empty array
                const existingHistoryRaw = localStorage.getItem(VIEWED_HISTORY_KEY);
                let history: ViewedItem[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

                // Remove existing entry for this item if it exists (to move it to the top)
                history = history.filter(item => item.id !== id);

                // Add the new item to the beginning of the array
                history.unshift(viewedItem);

                // Limit the history size
                if (history.length > MAX_HISTORY_ITEMS) {
                    history = history.slice(0, MAX_HISTORY_ITEMS);
                }

                // Save back to localStorage
                localStorage.setItem(VIEWED_HISTORY_KEY, JSON.stringify(history));
                console.log(`Stored view for item ${id} in localStorage.`);
            }
        } catch (error) {
            console.error("Failed to save view history to localStorage:", error);
        }
        // IMPORTANT: Navigation happens via the Link component, not this handler
    };

    return (
        <Card
            className="flex flex-col h-full w-full rounded-2xl border border-border bg-background shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
            onClick={handleCardClick}
        >
            <Link href={`/product/${id}`} className="flex flex-col h-full w-full group" aria-label={`View details for ${title}`}>
                <CardHeader className="p-0 relative">
                    <div className="aspect-video relative w-full bg-muted">
                        {image ? (
                            <Image
                                src={image}
                                alt={title || 'Listing image'}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
                                className="transition-transform duration-200 group-hover:scale-105 rounded-t-2xl"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center rounded-t-2xl">
                                <span className="text-base text-muted-foreground">No Image</span>
                            </div>
                        )}
                        {/* Optional: Status Badge or overlay */}
                        {/* <Badge variant="secondary" className="absolute top-2 right-2">Available</Badge> */}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 p-4 min-h-0">
                    <CardTitle className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-shrink-0">
                        {description}
                    </p>
                    {location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                        <Clock className="w-3.5 h-3.5" />
                        <span suppressHydrationWarning>
                            {createdAt && !isNaN(new Date(createdAt).getTime())
                                ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
                                : "Unknown time"}
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="p-4 pt-2 border-t bg-muted/40 flex items-center gap-2">
                    <Avatar className="h-8 w-8 border">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">
                            {user.name?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                </CardFooter>
            </Link>
        </Card>
    );
}

interface RateUserModalProps {
  userId: string;
  onClose: () => void;
  onRated?: () => void;
}

export function RateUserModal({ userId, onClose, onRated }: RateUserModalProps) {
  const [value, setValue] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/users/${userId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, comment }),
    });
    setLoading(false);
    onRated?.();
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="font-bold mb-2">Rate this user</h2>
      <textarea
        className="w-full border rounded p-2 mt-2"
        placeholder="Optional comment"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <button type="submit" className="mt-2 btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}