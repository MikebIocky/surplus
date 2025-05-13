// src/app/chat/[otherUserId]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Use hooks for params/navigation
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { SendHorizonal, Paperclip, MoreVertical, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns'; // For formatting timestamps

// Define Message type based on API response
interface MessageData {
    _id: string;
    sender: { _id: string; name: string; avatar?: string };
    content: string;
    createdAt: string;
    isOwn: boolean; // Flag added by API
}

// Define Other User type (fetched separately or passed)
interface OtherUserData {
     _id: string;
     name: string;
     avatar?: string;
}

function ChatMessage({ message }: { message: MessageData }) {
    const isOwn = message.isOwn;
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${isOwn ? 'bg-green-200 text-green-950' : 'bg-gray-100 text-gray-800'}`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1 text-right">
                    {format(new Date(message.createdAt), 'p')} {/* Format time e.g., 1:30 PM */}
                </p>
            </div>
        </div>
    );
}


export default function ChatPage() {
    const params = useParams(); // Get route params
    const router = useRouter();
    const { user: loggedInUser, isLoading: isAuthLoading } = useAuth();
    const otherUserId = params?.otherUserId as string; // Extract other user ID

    const [otherUser, setOtherUser] = useState<OtherUserData | null>(null); // State for other user's info
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for scroll area viewport

    // --- Function to scroll to bottom ---
    const scrollToBottom = useCallback(() => {
         setTimeout(() => { // Allow DOM update before scrolling
             const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
             if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
             }
         }, 50); // Small delay often helps
    }, []);

    // --- Fetch Initial Messages & Other User Info ---
    useEffect(() => {
        if (loggedInUser?.id && otherUserId) {
            setIsLoadingMessages(true);
            setError(null);
            console.log(`ChatPage: Fetching messages for conversation with ${otherUserId}`);

            // TODO: Fetch other user's details (name, avatar) - requires an API endpoint
            // Example: fetch(`/api/users/profile/${otherUserId}?basic=true`).then(...)
             setOtherUser({ _id: otherUserId, name: "Loading User...", avatar: undefined }); // Placeholder

            // Fetch messages
            fetch(`/api/chat/messages/${otherUserId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch messages');
                    return res.json();
                })
                .then(data => {
                    setMessages(data as MessageData[]);
                    scrollToBottom(); // Scroll down after loading initial messages
                })
                .catch(err => setError(err.message))
                .finally(() => setIsLoadingMessages(false));
        }
    }, [loggedInUser?.id, otherUserId, scrollToBottom]); // Dependencies


    // --- Polling for New Messages ---
     useEffect(() => {
        if (!loggedInUser?.id || !otherUserId) return; // Don't poll if IDs aren't ready

        console.log(`ChatPage: Starting message polling for chat with ${otherUserId}`);
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`/api/chat/messages/${otherUserId}`);
                if (!response.ok) return; // Ignore failed polls silently? Or show error?
                const newMessagesData = await response.json() as MessageData[];

                setMessages(prevMessages => {
                    // Basic check: If lengths differ or last message ID differs, update
                    if (newMessagesData.length !== prevMessages.length ||
                        (newMessagesData.length > 0 && prevMessages.length > 0 && newMessagesData[newMessagesData.length-1]._id !== prevMessages[prevMessages.length-1]._id)
                       ) {
                            console.log("ChatPage: Polling found new messages.");
                            scrollToBottom(); // Scroll down when new messages arrive
                            return newMessagesData; // Replace state with latest list
                    }
                    return prevMessages; // No change
                });
            } catch (err) {
                 console.error("ChatPage: Error during message polling:", err);
            }
        }, 5000); // Poll every 5 seconds (adjust interval as needed)

        // Cleanup interval on component unmount or when IDs change
        return () => {
             console.log(`ChatPage: Stopping message polling for chat with ${otherUserId}`);
             clearInterval(intervalId);
        };
    }, [loggedInUser?.id, otherUserId, scrollToBottom]); // Dependencies for polling


    // --- Send Message Handler ---
    const handleSendMessage = async (event?: FormEvent) => {
        event?.preventDefault(); // Prevent form submission if used in a form
        if (!newMessage.trim() || !otherUserId || !loggedInUser?.id || isSending) return;

        setIsSending(true);
        setError(null);
        const contentToSend = newMessage.trim();
        setNewMessage(''); // Clear input immediately

        try {
            const response = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiverId: otherUserId, content: contentToSend }),
            });

            const createdMessage = await response.json();

            if (!response.ok) {
                throw new Error(createdMessage.error || 'Failed to send message');
            }

            // Add the sent message optimistically (or wait for poll)
             setMessages(prev => [...prev, { ...createdMessage, isOwn: true }]);
             scrollToBottom(); // Scroll after sending

        } catch (err: any) {
            console.error("ChatPage: Send message error:", err);
            setError(err.message);
            setNewMessage(contentToSend); // Put message back in input on error
        } finally {
            setIsSending(false);
        }
    };

    // --- Render Logic ---
    if (isAuthLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    if (!loggedInUser) return <div className="flex-1 flex items-center justify-center"><p>Please log in to chat.</p></div>; // Should be handled by middleware mostly

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <header className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className='flex items-center gap-3'>
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => router.back()}> {/* Back button on mobile */}
                         <ArrowLeft className="h-5 w-5"/>
                    </Button>
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={otherUser?.avatar} alt={otherUser?.name} />
                        <AvatarFallback>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <h2 className="font-semibold text-lg">{otherUser?.name || 'Chat'}</h2>
                </div>
                 {/* Optional: More Actions Button */}
                 <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </header>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-gray-50" ref={scrollAreaRef}>
                {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin"/>
                    </div>
                ) : error ? (
                    <p className="text-red-600 text-center">{error}</p>
                ) : messages.length === 0 ? (
                     <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                ) : (
                    messages.map(msg => <ChatMessage key={msg._id} message={msg} />)
                )}
            </ScrollArea>

            {/* Message Input Area */}
            <footer className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" type="button">
                        <Paperclip className="h-5 w-5 text-gray-500"/>
                         <span className="sr-only">Attach file</span>
                    </Button>
                    <Input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        disabled={isSending}
                        autoComplete='off'
                    />
                    <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
                         {isSending ? <Loader2 className="h-4 w-4 animate-spin"/> : <SendHorizonal className="h-5 w-5"/>}
                         <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </footer>
        </div>
    );
}