import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Message from '@/models/Message';
import { getUserIdFromCookieServer } from '@/lib/authUtils';

// GET handler to fetch conversations
export async function GET() {
  try {
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    // Get all conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { 
            otherUserId: {
              $cond: [
                { $eq: ['$lastMessage.sender', new mongoose.Types.ObjectId(userId)] },
                '$lastMessage.receiver',
                '$lastMessage.sender'
              ]
            }
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$otherUserId'] }
              }
            },
            {
              $project: {
                name: 1,
                avatar: 1
              }
            }
          ],
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      },
      {
        $project: {
          conversationId: '$_id',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender'
          },
          unreadCount: 1,
          otherUser: {
            id: '$otherUser._id',
            name: '$otherUser.name',
            avatar: '$otherUser.avatar'
          }
        }
      }
    ]);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler to send a new message
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromCookieServer();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { receiverId, content } = await req.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create a unique conversation ID (sorted IDs to ensure consistency)
    const conversationId = [userId, receiverId].sort().join('_');

    const message = await Message.create({
      conversationId,
      sender: userId,
      receiver: receiverId,
      content: content.trim(),
    });

    // Populate sender and receiver details
    await message.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' }
    ]);

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 