'use client';

import React, { useEffect, useRef } from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageInput } from '@/components/MessageInput';
import Image from 'next/image';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

interface Message {
    _id?: string;
    content: string;
    sender: {
        _id: string;
        name?: string;
        avatar?: string;
    };
    createdAt: string;
}

interface OtherUser {
    _id: string;
    name: string;
    avatar?: string;
}

interface ConversationClientProps {
    messages: Message[];
    currentUserId: string;
    conversationId: string;
    otherUser: OtherUser;
}

export function ConversationClient({ messages, currentUserId, conversationId, otherUser }: ConversationClientProps) {
    const [chatMessages, setChatMessages] = React.useState<Message[]>(messages);
    const [pendingMessages, setPendingMessages] = React.useState<Message[]>([]);
    const pendingMessagesRef = useRef(pendingMessages);
    useEffect(() => { pendingMessagesRef.current = pendingMessages; }, [pendingMessages]);

    useEffect(() => {
        setChatMessages(messages);
        setPendingMessages([]);
    }, [conversationId, messages]);

    const handleMessageSent = (msg: Message) => {
        setPendingMessages(prev => [...prev, msg]);
        setChatMessages(prev => [...prev, msg]);
    };

    const PatchedMessageList = (props: any) => (
        <MessageList
            {...props}
            messages={props.messages.map((m: Message, idx: number) => ({
                ...m,
                _id: m._id || `${m.content}-${m.createdAt}-${idx}`
            }))}
        />
    );

    return (
        <div className="flex flex-col max-w-5xl mx-auto bg-white/90 rounded-2xl shadow-2xl border border-gray-200 mt-10 h-[80vh] overflow-hidden relative">
            {/* Chat Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 p-6 border-b bg-gradient-to-r from-primary/10 to-white/80 rounded-t-2xl shadow-sm backdrop-blur">
                <Image
                    src={otherUser.avatar || '/default-avatar.png'}
                    alt={otherUser.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 shadow"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                    }}
                />
                <div>
                    <div className="font-semibold text-xl text-primary">{otherUser.name}</div>
                    <div className="text-xs text-gray-500">Chat session</div>
                </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 w-full flex flex-col gap-2">
                <PatchedMessageList 
                    messages={chatMessages}
                    currentUserId={currentUserId}
                />
            </div>
            {/* Input */}
            <div className="sticky bottom-0 z-10 p-4 border-t bg-white/80 rounded-b-2xl shadow-sm backdrop-blur">
                <MessageInput 
                    recipientId={otherUser._id}
                    currentUserId={currentUserId}
                    onMessageSent={handleMessageSent}
                />
            </div>
        </div>
    );
} 