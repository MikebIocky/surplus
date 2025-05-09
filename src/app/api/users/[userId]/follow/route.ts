import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import User from '@/models/User';

const AUTH_COOKIE = 'authToken'; // <-- Set this to your actual cookie name

// Helper function to get logged in user ID from cookies
async function getLoggedInUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload as any).user?.id as string;
  } catch (error) {
    return null;
  }
}

// POST /api/users/[userId]/follow
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  try {
    const loggedInUserId = await getLoggedInUserId();
    if (!loggedInUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (loggedInUserId === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Update both users in a single transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Add target user to following list
      await User.findByIdAndUpdate(
        loggedInUserId,
        { $addToSet: { following: userId } },
        { session }
      );

      // Add current user to target's followers list
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { followers: loggedInUserId } },
        { session }
      );

      await session.commitTransaction();
      return NextResponse.json({ message: 'Successfully followed user' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/follow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  try {
    const loggedInUserId = await getLoggedInUserId();
    if (!loggedInUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Update both users in a single transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove target user from following list
      await User.findByIdAndUpdate(
        loggedInUserId,
        { $pull: { following: userId } },
        { session }
      );

      // Remove current user from target's followers list
      await User.findByIdAndUpdate(
        userId,
        { $pull: { followers: loggedInUserId } },
        { session }
      );

      await session.commitTransaction();
      return NextResponse.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

async function checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
  const user = await User.findById(followerId).select('following').lean();
  return user?.following?.some((id: mongoose.Types.ObjectId) => id.toString() === followingId) ?? false;
} 