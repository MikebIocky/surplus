'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ userId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? 'Unfollowed' : 'Following',
        description: isFollowing ? 'You have unfollowed this user' : 'You are now following this user',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
} 