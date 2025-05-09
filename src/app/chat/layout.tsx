// src/app/chat/layout.tsx
"use client"; // Needs client for state, fetching, interaction

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth provides user ID
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamps

// Define Conversation type based on API response
interface ConversationPreview {
    _id: string;
    otherParticipant: { _id: string; name: string; avatar?: string } | null;
    lastMessage?: { content: string; senderName: string; createdAt: string; isOwn: boolean; } | null;
    updatedAt: string;
}

function ConversationListItem({ convo, currentChatUserId }: { convo: ConversationPreview; currentChatUserId?: string }) {
    if (!convo.otherParticipant) return null; // Skip rendering if participant info is missing

    const isActive = convo.otherParticipant._id === currentChatUserId;
    const lastMsgText = convo.lastMessage
        ? `${convo.lastMessage.isOwn ? 'You: ' : ''}${convo.lastMessage.content}`
        : 'No messages yet';

    return (
        <Link
            href={`/chat/${convo.otherParticipant._id}`}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-green-200 transition-colors ${isActive ? 'bg-green-200 font-semibold' : ''}`}
            key={convo._id}
        >
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={convo.otherParticipant.avatar} alt={convo.otherParticipant.name} />
                <AvatarFallback>{convo.otherParticipant.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="truncate">{convo.otherParticipant.name}</p>
                    {convo.lastMessage && (
                         <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNowStrict(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                         </p>
                    )}
                </div>
                <p className="text-sm text-gray-600 truncate">{lastMsgText}</p>
            </div>
        </Link>
    );
}


export default function ChatLayout({ children, params }: { children: React.ReactNode; params?: { otherUserId?: string } }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch conversations when user is loaded
    useEffect(() => {
        if (user?.id) {
            setIsLoadingConvos(true);
            setError(null);
            fetch('/api/chat/conversations')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch conversations');
                    return res.json();
                })
                .then(data => setConversations(data as ConversationPreview[]))
                .catch(err => setError(err.message))
                .finally(() => setIsLoadingConvos(false));
        } else if (!isAuthLoading) {
            // Handle case where user is definitely not logged in
             setIsLoadingConvos(false);
             setConversations([]); // Clear convos if logged out
        }
    }, [user?.id, isAuthLoading]); // Re-fetch if user ID changes

    // Get the ID of the user being chatted with from the nested page's params (if available)
    // Note: Accessing child route params in layout is complex. Usually done differently.
    // For this example, we assume a way to know the active chat. A state management
    // solution (Zustand, Redux) or passing info via route might be needed.
    // We'll simulate using a hypothetical 'params.otherUserId' passed down.
    const currentChatUserId = params?.otherUserId;


    return (
        <div className="flex h-[calc(100vh-var(--header-height,65px))]"> {/* Adjust header height variable */}
            {/* Sidebar with Conversation List */}
            <aside className="w-1/4 min-w-[280px] max-w-[350px] border-r bg-green-50/50 flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Chats</h2>
                    {/* Optional: Search Bar */}
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {isAuthLoading || isLoadingConvos ? (
                            // Skeleton Loader
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 h-[68px]">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                            ))
                        ) : error ? (
                            <p className="text-red-600 p-4 text-center">{error}</p>
                        ) : conversations.length === 0 ? (
                             <p className="text-gray-500 p-4 text-center">No conversations yet.</p>
                        ) : (
                            conversations.map(convo => (
                                <ConversationListItem
                                     key={convo._id}
                                     convo={convo}
                                     currentChatUserId={currentChatUserId} // Pass active ID for styling
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </aside>

            {/* Main Chat Area (rendered by child pages) */}
            <main className="flex-1 flex flex-col bg-white">
                {children}
            </main>
        </div>
    );
}