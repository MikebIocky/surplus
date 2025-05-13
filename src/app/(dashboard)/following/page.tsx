import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import User from '@/models/User';
import { UserProfileDisplay } from '@/components/UserProfileDisplay';

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

export default async function FollowingPage() {
  const loggedInUserId = await getLoggedInUserId();
  if (!loggedInUserId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Following</h1>
        <p>Please log in to view your following list.</p>
      </div>
    );
  }

  const user = await User.findById(loggedInUserId)
    .populate('following', 'name email avatar description rating createdAt updatedAt')
    .lean();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Following</h1>
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Following</h1>
      {user.following.length === 0 ? (
        <p>You are not following anyone yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(user.following as unknown[])
            .filter((f): f is {
              _id: { toString: () => string };
              name: string;
              email: string;
              avatar?: string;
              description?: string;
              rating?: number;
              createdAt: Date;
              updatedAt: Date;
            } => typeof f === 'object' && f !== null && 'name' in f && 'email' in f)
            .map((followedUser) => (
              <UserProfileDisplay
                key={followedUser._id.toString()}
                user={{
                  id: followedUser._id.toString(),
                  name: followedUser.name,
                  email: followedUser.email,
                  avatar: followedUser.avatar,
                  description: followedUser.description || '',
                  rating: followedUser.rating || 0,
                  createdAt: followedUser.createdAt,
                  updatedAt: followedUser.updatedAt,
                }}
                isFollowing={true}
              />
            ))}
        </div>
      )}
    </div>
  );
} 