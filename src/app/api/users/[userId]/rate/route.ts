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
    return (payload as any).user?.id as string;
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

  if (!(user as any).ratings) {
    (user as any).ratings = [];
  }

  // Prevent duplicate ratings from the same user (optional: allow updating)
  const existing = (user as any).ratings.find((r: any) => r.from.toString() === raterId);
  if (existing) {
    existing.value = valueNumber;
    existing.comment = comment;
    existing.createdAt = new Date();
  } else {
    (user as any).ratings.push({ from: raterId, value: valueNumber, comment, createdAt: new Date() });
  }

  // Update average rating
  (user as any).averageRating =
    (user as any).ratings.reduce((sum: number, r: any) => sum + r.value, 0) / (user as any).ratings.length;

  await user.save();

  return NextResponse.json({ message: 'Rating submitted', averageRating: (user as any).averageRating });
}
