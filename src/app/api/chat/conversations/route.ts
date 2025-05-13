// src/app/api/chat/conversations/route.ts (GET Conversations List)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Message from '@/models/Message'; // Import Message to populate lastMessage
import { getUserIdFromRequest } from '@/lib/authUtils'; // Your helper to get user ID from cookie/token

function isObjectWithId(val: unknown): val is { _id: { toString: () => string } } {
  return typeof val === 'object' && val !== null && '_id' in val && typeof (val as any)._id === 'object' && (val as any)._id !== null && 'toString' in (val as any)._id;
}

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
            const lastMsg = convo.lastMessage as { content?: string; sender?: string; createdAt?: string };
            return {
                _id: convo._id,
                otherParticipant: isObjectWithId(otherParticipant)
                    ? {
                        name: (otherParticipant as { name?: string }).name,
                        _id: otherParticipant._id.toString(),
                    }
                    : { name: undefined, _id: undefined },
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    sender: lastMsg.sender,
                    createdAt: lastMsg.createdAt,
                    isOwn:
                        typeof lastMsg.sender === 'object' &&
                        lastMsg.sender !== null &&
                        '_id' in lastMsg.sender &&
                        typeof (lastMsg.sender as any)._id === 'object' &&
                        (lastMsg.sender as any)._id !== null &&
                        'toString' in (lastMsg.sender as any)._id
                            ? (lastMsg.sender as { _id: { toString: () => string } })._id.toString() === userId
                            : lastMsg.sender === userId,
                } : null,
                updatedAt: convo.updatedAt,
            };
        }).filter(c => typeof c.otherParticipant._id === 'string' && c.otherParticipant._id.length > 0); // Filter out malformed convos

        return NextResponse.json(formattedConversations);

    } catch (error) {
        console.error("[API GET CONVERSATIONS] Error:", error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}