"use client";
import { formatDistanceToNow } from 'date-fns';

export function RelativeTime({ date }: { date: string }) {
  return (
    <span className="text-xs opacity-70 mt-1 block text-right">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
} 