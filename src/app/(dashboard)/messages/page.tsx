"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Conversation {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    fetch("/api/chat/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Your Conversations</h1>
      {conversations.length === 0 ? (
        <div className="text-gray-500 text-lg">No conversations yet.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              href={`/messages/${conv._id}`}
              className="flex items-center gap-6 p-6 border rounded-xl shadow hover:shadow-lg hover:bg-gray-50 transition group"
              style={{ minHeight: 90 }}
            >
              <div className="flex-shrink-0">
                <img
                  src={conv.otherParticipant.avatar || "/default-avatar.png"}
                  alt={conv.otherParticipant.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-primary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate">{conv.otherParticipant.name}</div>
                <div className="text-sm text-gray-500 truncate max-w-full">
                  {conv.lastMessage?.content || <span className="italic text-gray-400">No messages yet</span>}
                </div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                {conv.lastMessage?.createdAt
                  ? new Date(conv.lastMessage.createdAt).toLocaleString()
                  : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 