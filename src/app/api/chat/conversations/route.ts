// src/app/api/chat/conversations/route.ts (GET Conversations List)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Message from '@/models/Message'; // Import Message to populate lastMessage
import { getUserIdFromRequest } from '@/lib/authUtils'; // Your helper to get user ID from cookie/token

export async function GET(req: NextRequest) {
    const userId = await getUserIdFromRequest(req); // Assumes helper verifies token
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await dbConnect();
        const conversations = await Conversation.find({ participants: userId })
            .populate({ // Populate other participant's info
                path: 'participants',
                match: { _id: { $ne: userId } }, // Exclude self
                select: 'name avatar', // Fields to show in list
                model: User
            })
            .populate({ // Populate last message content snippet
                path: 'lastMessage',
                select: 'content sender createdAt', // Fields for preview
                model: Message,
                populate: { // Populate sender of last message briefly
                    path: 'sender',
                    select: 'name',
                    model: User
                }
            })
            .sort({ updatedAt: -1 }) // Sort by most recently active
            .lean();

        // Clean up the data structure for the client
        const formattedConversations = conversations.map(convo => {
            const otherParticipant = convo.participants.find(p => p?._id?.toString() !== userId);
            // Type assertion for populated lastMessage
            const lastMsg = convo.lastMessage as any;
            return {
                _id: convo._id,
                otherParticipant: otherParticipant || null, // The user being chatted with
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    senderName: lastMsg.sender?.name || '...', // Handle potential missing sender
                    createdAt: lastMsg.createdAt,
                    isOwn: lastMsg.sender?._id?.toString() === userId,
                } : null,
                updatedAt: convo.updatedAt,
            };
        }).filter(c => c.otherParticipant); // Filter out potential malformed convos

        return NextResponse.json(formattedConversations);

    } catch (error) {
        console.error("[API GET CONVERSATIONS] Error:", error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}