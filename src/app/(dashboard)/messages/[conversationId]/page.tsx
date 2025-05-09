"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  read: boolean;
}

interface ConversationUser {
  id: string;
  name: string;
  avatar?: string;
}

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const conversationId = React.use(params).conversationId;
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<ConversationUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('Raw params:', params);
  console.log('Extracted conversationId:', conversationId);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/log-in?reason=unauthenticated');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!conversationId || !user) {
          console.log('Missing conversationId or user, skipping fetch');
          setError('Missing conversation information');
          return;
        }

        // Extract the other user's ID from the conversation ID
        const userIds = conversationId.split('_');
        const otherUserId = userIds.find(id => id !== user.id);
        
        if (!otherUserId) {
          console.error('Could not determine other user ID from conversation:', conversationId);
          setError('Invalid conversation');
          return;
        }

        console.log('Fetching messages for conversation:', conversationId);
        console.log('Current user:', user.id);
        console.log('Other user:', otherUserId);
        
        const response = await fetch(`/api/chat/messages/${otherUserId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else if (response.status === 401) {
            router.replace('/log-in?reason=unauthenticated');
          } else {
            throw new Error(data.error || 'Failed to fetch messages');
          }
          return;
        }
        
        setError(null); // Clear any previous errors
        setMessages(data);
        
        // Set other user info
        if (data.length > 0) {
          const otherUserData = data[0]?.sender._id === user?.id 
            ? data[0]?.receiver 
            : data[0]?.sender;
          if (otherUserData) {
            setOtherUser({
              id: otherUserData._id,
              name: otherUserData.name,
              avatar: otherUserData.avatar
            });
          }
        } else {
          // If no messages yet, we still need to set up the other user info
          setOtherUser({
            id: otherUserId,
            name: 'Chat User', // This will be updated when the first message is received
            avatar: undefined
          });
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(error instanceof Error ? error.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchMessages();
      // Set up polling for new messages
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, conversationId, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUser.id,
          content: newMessage.trim(),
        }),
      });

      console.log('Send message response status:', response.status);
      const data = await response.json();
      console.log('Send message response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {otherUser && (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src={otherUser.avatar || '/default-avatar.png'}
                alt={otherUser.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h1 className="text-xl font-semibold">{otherUser.name}</h1>
          </div>
        )}
      </div>

      {/* Messages */}
      <Card className="mb-4">
        <CardContent className="p-4 h-[calc(100vh-300px)] overflow-y-auto">
          {error ? (
            <div className="text-center text-destructive">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender._id === user.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Input */}
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
      </form>
    </div>
  );
} 