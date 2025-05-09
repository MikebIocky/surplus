"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Conversation {
  _id: string;
  otherParticipant: {
    _id: string;
    name: string;
    avatar?: string;
  };
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
    isOwn: boolean;
  };
  updatedAt: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              Start a conversation by messaging someone from their profile or listing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <Card
              key={conversation._id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                console.log('Navigating to chat with user:', conversation.otherParticipant._id);
                router.push(`/messages/${conversation.otherParticipant._id}`);
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.otherParticipant.avatar} />
                  <AvatarFallback>
                    {conversation.otherParticipant.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{conversation.otherParticipant.name}</h3>
                    {conversation.lastMessage && (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage.isOwn ? 'You: ' : `${conversation.lastMessage.senderName}: `}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 