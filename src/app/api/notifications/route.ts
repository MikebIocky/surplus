import { NextResponse } from 'next/server';
import { Notification } from '@/models/Notification';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await Notification.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const notification = await Notification.create(body);
    return NextResponse.json(notification);
  } catch (error: unknown) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
} 