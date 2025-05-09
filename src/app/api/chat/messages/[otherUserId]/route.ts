// src/app/api/chat/messages/[otherUserId]/route.ts (GET Messages for a Chat)
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import User from '@/models/User';
import { getUserIdFromRequest } from '@/lib/authUtils';
import mongoose from 'mongoose';

export async function GET(
    req: NextRequest,
    { params }: { params: { otherUserId: string } }
) {
    try {
        console.log('API: Received request for messages');
        console.log('API: Raw params:', params);
        const loggedInUserId = await getUserIdFromRequest(req);
        console.log('API: Logged in user ID:', loggedInUserId);
        
        if (!loggedInUserId) {
            console.log('API: No user ID found in request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const otherUserId = params.otherUserId;
        console.log('API: Other user ID:', otherUserId);

        // Validate user IDs
        if (!mongoose.Types.ObjectId.isValid(loggedInUserId) || !mongoose.Types.ObjectId.isValid(otherUserId)) {
            console.error('API: Invalid user ID format', { loggedInUserId, otherUserId });
            return NextResponse.json(
                { error: 'Invalid user ID format' },
                { status: 400 }
            );
        }

        // Verify both users exist
        try {
            const [currentUser, otherUser] = await Promise.all([
                User.findById(loggedInUserId).select('_id').lean(),
                User.findById(otherUserId).select('_id').lean()
            ]);

            if (!currentUser || !otherUser) {
                console.error('API: One or both users not found', { currentUser, otherUser });
                return NextResponse.json(
                    { error: 'One or both users not found' },
                    { status: 404 }
                );
            }
        } catch (userError) {
            console.error('API: Error verifying users:', userError);
            return NextResponse.json(
                { error: 'Failed to verify users' },
                { status: 500 }
            );
        }
        
        // Find the conversation between the two users
        const participants = [loggedInUserId, otherUserId].sort();
        console.log('API: Looking for conversation with participants:', participants);
        
        try {
            await dbConnect();
            console.log('API: Connected to database');
        } catch (dbError) {
            console.error('API: Database connection error:', dbError);
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 500 }
            );
        }

        let conversation;
        try {
            // First try to find by participants
            console.log('API: Attempting to find conversation by participants:', participants);
            console.log('API: Participants as ObjectIds:', participants.map(id => new mongoose.Types.ObjectId(id)));
            
            // Try to find by participants first
            console.log('API: Looking for conversation by participants');
            conversation = await Conversation.findOne({
                participants: { 
                    $all: participants.map(id => new mongoose.Types.ObjectId(id)),
                    $size: 2
                }
            });
            console.log('API: Find by participants result:', conversation);
            
            // If not found, create a new conversation
            if (!conversation) {
                console.log('API: No conversation found, creating new conversation');
                try {
                    // Create a new conversation with a simple string ID
                    const newConversationData = {
                        participants: participants.map(id => new mongoose.Types.ObjectId(id))
                    };
                    console.log('API: Creating conversation with data:', newConversationData);
                    
                    conversation = await Conversation.create(newConversationData);
                    console.log('API: Created new conversation:', conversation);
                } catch (createError) {
                    console.error('API: Error creating conversation:', createError);
                    if (createError instanceof Error) {
                        console.error('API: Error details:', {
                            name: createError.name,
                            message: createError.message,
                            stack: createError.stack
                        });
                    }
                    return NextResponse.json(
                        { error: 'Failed to create conversation: ' + (createError instanceof Error ? createError.message : 'Unknown error') },
                        { status: 500 }
                    );
                }
            }
            
            console.log('API: Final conversation result:', conversation);
            
            if (!conversation) {
                throw new Error('Failed to find or create conversation');
            }
        } catch (convoError) {
            console.error('API: Error finding/creating conversation:', convoError);
            if (convoError instanceof Error) {
                console.error('API: Error details:', {
                    name: convoError.name,
                    message: convoError.message,
                    stack: convoError.stack
                });
            }
            return NextResponse.json(
                { error: 'Failed to find or create conversation: ' + (convoError instanceof Error ? convoError.message : 'Unknown error') },
                { status: 500 }
            );
        }

        // Fetch messages for this conversation
        let messages;
        try {
            console.log('API: Fetching messages for conversation:', conversation._id);
            console.log('API: Conversation details:', {
                id: conversation._id,
                participants: conversation.participants
            });

            // First, ensure we have a valid conversation ID
            if (!conversation._id) {
                throw new Error('Invalid conversation ID');
            }

            // Find messages and populate sender details
            messages = await Message.find({ conversation: conversation._id })
                .sort({ createdAt: 1 })
                .limit(50)
                .populate({
                    path: 'sender',
                    select: 'name avatar _id',
                    model: User
                })
                .populate({
                    path: 'receiver',
                    select: 'name avatar _id',
                    model: User
                })
                .lean();

            console.log('API: Found messages:', messages.length);
            if (messages.length > 0) {
                console.log('API: First message details:', {
                    id: messages[0]._id,
                    sender: messages[0].sender,
                    receiver: messages[0].receiver,
                    content: messages[0].content
                });
            }
        } catch (messageError) {
            console.error('API: Error fetching messages:', messageError);
            if (messageError instanceof Error) {
                console.error('API: Error details:', {
                    name: messageError.name,
                    message: messageError.message,
                    stack: messageError.stack
                });
            }
            return NextResponse.json(
                { error: 'Failed to fetch messages: ' + (messageError instanceof Error ? messageError.message : 'Unknown error') },
                { status: 500 }
            );
        }

        // Map to add isOwn flag
        const formattedMessages = messages.map(msg => ({
            ...msg,
            isOwn: msg.sender?._id?.toString() === loggedInUserId
        }));

        return NextResponse.json(formattedMessages);

    } catch (error) {
        console.error(`[API GET MESSAGES/${params.otherUserId}] Unexpected error:`, error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
