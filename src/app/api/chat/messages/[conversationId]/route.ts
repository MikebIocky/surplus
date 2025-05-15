import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Message from '@/models/Message';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  await dbConnect();
  const { conversationId } = params;
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }
  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json(messages || []);
} 