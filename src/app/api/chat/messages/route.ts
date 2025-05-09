// src/app/api/chat/messages/route.ts (POST New Message)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { getUserIdFromRequest } from '@/lib/authUtils';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    try {
        const senderId = await getUserIdFromRequest(req);
        if (!senderId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { receiverId, content } = await req.json();

        if (!receiverId || !content || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return NextResponse.json(
                { error: 'Invalid receiver ID or missing content' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Ensure receiver exists
        const receiver = await User.findById(receiverId).select('_id').lean();
        if (!receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
        }

        // Find or create conversation
        const participants = [senderId, receiverId].sort();
        let conversation = await Conversation.findOneAndUpdate(
            { participants },
            { $set: { participants } },
            { upsert: true, new: true }
        );

        // Create message
        const message = await Message.create({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content: content.trim(),
        });

        // Update conversation's last message
        conversation.lastMessage = message._id as mongoose.Types.ObjectId;
        await conversation.save();

        // Populate sender info for response
        await message.populate('sender', 'name avatar');

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}