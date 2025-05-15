import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import mongoose from 'mongoose';
import { ConversationClient } from './ConversationClient';
import { formatDistanceToNow } from 'date-fns';

interface MongoMessage {
    _id: mongoose.Types.ObjectId;
    content: string;
    sender: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; avatar?: string };
    createdAt: Date;
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const resolvedParams = await params;
    const { conversationId } = resolvedParams;

    // Get the current user's ID from the JWT token
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        notFound();
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const currentUserId = (payload as { user?: { id?: string } }).user?.id;

    if (!currentUserId) {
        notFound();
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(currentUserId) || !mongoose.Types.ObjectId.isValid(conversationId)) {
        notFound();
    }

    await dbConnect();

    // Fetch the conversation by ID
    const conversation = await Conversation.findById(conversationId)
        .populate('participants', 'name avatar')
        .lean();
    if (!conversation) {
        notFound();
    }

    // Find the other participant
    const participants = (conversation as any).participants as any[];
    const otherUser = participants.find((u) => u._id.toString() !== currentUserId);
    if (!otherUser) {
        notFound();
    }
    const formattedOtherUser = {
        ...otherUser,
        _id: otherUser._id.toString(),
    };

    // Fetch messages for the conversation, populating sender's name and avatar
    const rawMessages = await Message.find({ conversation: conversationId })
        .sort({ createdAt: 1 })
        .populate('sender', 'name avatar')
        .lean();

    // Transform messages to match the expected type
    const messageList = (rawMessages as unknown as MongoMessage[]).map((msg) => ({
        _id: msg._id.toString(),
        content: msg.content,
        sender: (() => {
            if (msg.sender && typeof msg.sender === 'object' && 'name' in msg.sender) {
                return {
                    _id: msg.sender._id.toString(),
                    name: msg.sender.name,
                    avatar: msg.sender.avatar,
                };
            } else {
                // fallback for ObjectId
                return {
                    _id: msg.sender?.toString?.() || '',
                    name: '',
                    avatar: undefined,
                };
            }
        })(),
        createdAt: msg.createdAt.toISOString(),
    }));

    return (
        <ConversationClient
            messages={messageList}
            currentUserId={currentUserId}
            conversationId={conversationId}
            otherUser={formattedOtherUser}
        />
    );
} 