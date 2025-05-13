// src/components/ProductCard.tsx
"use client"; // Must be a client component for onClick and localStorage

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

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
    <Link
      href={`/product/${id}`}
      className="flex flex-col h-full rounded-2xl overflow-hidden shadow-md bg-white border border-border hover:shadow-xl transition-shadow duration-200"
      aria-label={`View details for ${title}`}
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 flex-shrink-0">
        <Image
          src={typeof image === 'string' && image.trim() ? image : '/no-image.png'}
          alt={title || "Listing image"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          priority={false}
          loading="lazy"
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 justify-between p-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span suppressHydrationWarning>
            {createdAt && !isNaN(new Date(createdAt).getTime())
              ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "Unknown time"}
          </span>
        </div>
        <div className="flex items-center gap-2 border-t pt-3 mt-2">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm text-gray-800 truncate">{user.name}</span>
        </div>
      </div>
    </Link>
  );
}

interface RateUserModalProps {
  userId: string;
  onClose: () => void;
  onRated?: () => void;
}

export function RateUserModal({ userId, onClose, onRated }: RateUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/users/${userId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: 5, comment: "" }),
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
        value=""
        onChange={e => {}}
      />
      <button type="submit" className="mt-2 btn btn-primary" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

export type { ProductCardProps };

export function FollowButton({ profileId, isFollowingInitial }: { profileId: string, isFollowingInitial: boolean }) {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await fetch(`/api/users/${profileId}/follow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow" }),
      });
      if (res.ok) setIsFollowing(!isFollowing);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`px-4 py-2 rounded ${isFollowing ? "bg-gray-200" : "bg-primary text-white"}`}
    >
      {pending ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}