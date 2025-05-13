import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import mongoose from 'mongoose';
import User from '@/models/User';

const AUTH_COOKIE = 'authToken';

async function getLoggedInUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload as { user?: { id?: string } }).user?.id as string;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const raterId = await getLoggedInUserId();
  if (!raterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!mongoose.Types.ObjectId.isValid(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  if (raterId === userId) return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 });

  const { value, comment } = await request.json();
  const valueNumber = Number(value);
  console.log('Received value:', valueNumber, typeof valueNumber);
  if (typeof valueNumber !== 'number' || valueNumber < 1 || valueNumber > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  type Rating = { from: string; value: number; comment: string; createdAt: Date };
  type UserWithRatings = typeof user & { ratings: Rating[]; averageRating: number };
  const userWithRatings = user as UserWithRatings;
  if (!userWithRatings.ratings) {
    userWithRatings.ratings = [];
  }

  // Prevent duplicate ratings from the same user (optional: allow updating)
  const existing = userWithRatings.ratings.find((r) => r.from.toString() === raterId);
  if (existing) {
    existing.value = valueNumber;
    existing.comment = comment;
    existing.createdAt = new Date();
  } else {
    userWithRatings.ratings.push({ from: raterId, value: valueNumber, comment, createdAt: new Date() });
  }

  // Update average rating
  userWithRatings.averageRating =
    userWithRatings.ratings.reduce((sum, r) => sum + r.value, 0) / userWithRatings.ratings.length;

  await user.save();

  return NextResponse.json({ message: 'Rating submitted', averageRating: userWithRatings.averageRating });
}
