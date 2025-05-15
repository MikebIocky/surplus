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
    console.log('DEBUG senderId:', senderId);
    const body = await req.json();
    console.log('DEBUG request body:', body);
    if (!senderId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content } = body;
    if (!receiverId || !content || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json({ error: 'Invalid receiver ID or missing content' }, { status: 400 });
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
      recipient: receiverId,
      content: content.trim(),
    });

    // Update conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    return NextResponse.json({ conversation: conversation._id.toString() });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}