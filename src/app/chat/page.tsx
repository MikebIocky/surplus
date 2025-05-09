// src/app/chat/page.tsx
"use client"; // Can be client or server, depending on need

import React from 'react';

export default function DefaultChatPage() {
  // This page is shown when user navigates to /chat without a specific user ID
  // You could show instructions, recent chats overview, etc.
  return (
    <div className="flex-1 flex items-center justify-center h-full bg-gray-50">
      <p className="text-muted-foreground">Select a conversation to start chatting.</p>
    </div>
  );
}