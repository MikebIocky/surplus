'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

interface MessageInputProps {
    recipientId: string;
    currentUserId: string;
    onMessageSent?: (msg: Message) => void;
}

export function MessageInput({ recipientId, currentUserId, onMessageSent }: MessageInputProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        setError(null);

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receiverId: recipientId,
                    content: newMessage.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setNewMessage('');
            if (onMessageSent) {
                onMessageSent({
                    ...data,
                    content: newMessage.trim(),
                    sender: {
                        _id: currentUserId,
                        name: user?.name || '',
                        avatar: user?.avatar || undefined,
                    },
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError(error instanceof Error ? error.message : 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={isSending}
                className="flex-grow"
            />
            <Button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
            {error && (
                <div className="text-destructive text-sm mt-2">
                    {error}
                </div>
            )}
        </form>
    );
} 