'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { RelativeTime } from './RelativeTime';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface Message {
    _id: string;
    content: string;
    sender: {
        _id: string;
        avatar?: string;
        name?: string;
    };
    createdAt: string;
}

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {messages.map((message, idx) => {
                const isOwn = message.sender._id === currentUserId;
                return (
                    <div
                        key={message._id || `${message.content}-${message.createdAt}-${idx}`}
                        className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'} items-end`}
                    >
                        {/* Other user avatar */}
                        {!isOwn && (
                            <Image
                                src={message.sender.avatar || "/default-avatar.png"}
                                alt={message.sender.name || "User"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 bg-white mr-3"
                            />
                        )}
                        {/* Bubble */}
                        <div
                            className={`relative max-w-[95%] px-5 py-3 rounded-lg border text-base
                                ${isOwn
                                    ? 'bg-green-500 text-white border-green-500 ml-2'
                                    : 'bg-gray-100 text-gray-900 border-gray-300 mr-2'
                                }`}
                        >
                            <p className="break-words leading-relaxed">{message.content}</p>
                            <RelativeTime date={message.createdAt} />
                        </div>
                        {/* Own avatar */}
                        {isOwn && (
                            <Image
                                src={message.sender.avatar || "/default-avatar.png"}
                                alt={message.sender.name || "You"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border-2 border-green-200 bg-white ml-3"
                            />
                        )}
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
} 