import { NextRequest, NextResponse } from 'next/server';
import Message from '@/models/Message';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromCookieServer } from '@/lib/authUtils';

// GET handler to fetch messages in a conversation
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 1. Get user ID from cookie
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to database
    await dbConnect();

    // 3. Get conversation ID from params
    const conversationId = params.conversationId;

    // 4. Fetch messages for the conversation
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .lean();

    // 5. Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 