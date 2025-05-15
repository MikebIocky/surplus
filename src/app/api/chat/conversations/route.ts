// src/app/api/chat/conversations/route.ts (GET Conversations List)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import Message from '@/models/Message'; // Import Message to populate lastMessage
import { getUserIdFromRequest } from '@/lib/authUtils'; // Your helper to get user ID from cookie/token

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

function isSenderObject(val: unknown): val is { _id: { toString: () => string } } {
  if (typeof val !== 'object' || val === null || !('_id' in val)) return false;
  const id = (val as { _id?: unknown })._id;
  return typeof id === 'object' && id !== null && 'toString' in id;
}

function isValidParticipant(u: any): u is { _id: { toString: () => string }, name: string, avatar?: string } {
  return u && typeof u === 'object' && '_id' in u && 'name' in u && typeof u.name === 'string';
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
            const otherUser = (convo.participants as unknown[]).find((u: any) => isValidParticipant(u) && u._id.toString() !== userId);
            // Type assertion for populated lastMessage
            const lastMsg = convo.lastMessage as { content?: string; sender?: string; createdAt?: string };
            return {
                _id: convo._id,
                otherParticipant: isValidParticipant(otherUser)
                    ? {
                        _id: otherUser._id.toString(),
                        name: otherUser.name,
                        avatar: otherUser.avatar,
                    }
                    : null,
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    sender: lastMsg.sender,
                    createdAt: lastMsg.createdAt,
                    isOwn:
                        isSenderObject(lastMsg.sender)
                            ? (lastMsg.sender as { _id: { toString: () => string } })._id.toString() === userId
                            : lastMsg.sender === userId,
                } : null,
                updatedAt: convo.updatedAt,
            };
        }).filter(c => c.otherParticipant && typeof c.otherParticipant._id === 'string' && c.otherParticipant._id.length > 0); // Filter out malformed convos

        return NextResponse.json(formattedConversations);

    } catch (error) {
        console.error("[API GET CONVERSATIONS] Error:", error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}