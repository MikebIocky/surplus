"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Claim {
  id: string;
  orderId?: string;
  title: string;
  image?: string;
  pendingClaim: {
    user: {
      id: string;
      name: string;
      avatar?: string;
    } | null;
    requestedAt: string;
  } | null;
}

const Ordering = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/listings/owner-claims');
        if (!res.ok) throw new Error('Failed to fetch claims');
        const data = await res.json();
        setClaims(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  useEffect(() => {
    // Get current user ID from cookie
    const getCurrentUserId = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    getCurrentUserId();
  }, []);

  const handleAction = async (listingId: string, orderId: string, action: 'accept' | 'decline') => {
    setActionLoading(listingId + action);
    try {
      const res = await fetch(`/api/listings/${listingId}/review-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          orderId: orderId 
        }),
      });
      if (!res.ok) throw new Error('Failed to update claim');
      // Refresh claims
      setClaims((prev) => prev.filter((c) => c.id !== listingId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update claim');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessageClick = async (userId: string, claimId: string) => {
    if (!currentUserId) {
      alert('Please log in to send messages');
      return;
    }

    setLoadingMessageId(claimId);
    try {
      // Create a new conversation with an initial message
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: userId,
          content: `Hi! I'm interested in your claim for "${claims.find(c => c.id === claimId)?.title}"`
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversation}`);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (err) {
      alert('Failed to start conversation. Please try again.');
    } finally {
      setLoadingMessageId(null);
    }
  };

  if (loading) return <div className='p-8 text-center'>Loading claims...</div>;
  if (error) return <div className='p-8 text-center text-red-500'>{error}</div>;

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Pending Claims</h1>
      {claims.length === 0 ? (
        <div className='text-gray-500'>No pending claims.</div>
      ) : (
        <div className='space-y-6'>
          {claims.map((claim) => {
            const hasClaimer = !!(claim.pendingClaim && claim.pendingClaim.user && claim.pendingClaim.user.id);
            return (
              <div key={claim.id} className='border rounded-lg p-4 flex items-center gap-4'>
                <Image
                  src={claim.image || '/no-image.png'}
                  alt={claim.title}
                  width={80}
                  height={80}
                  className='rounded object-cover bg-gray-100'
                />
                <div className='flex-1'>
                  <div className='font-semibold'>{claim.title}</div>
                  {hasClaimer && (
                    <div className='flex items-center gap-2 mt-1'>
                      <Image
                        src={claim.pendingClaim!.user!.avatar || '/default-avatar.png'}
                        alt={claim.pendingClaim!.user!.name}
                        width={32}
                        height={32}
                        className='rounded-full object-cover'
                      />
                      <span>{claim.pendingClaim!.user!.name}</span>
                    </div>
                  )}
                  <div className='text-xs text-gray-500 mt-1'>
                    Requested
                    {hasClaimer && claim.pendingClaim!.user!.name && (
                      <> by <span className="font-medium text-gray-700">{claim.pendingClaim!.user!.name}</span></>
                    )}
                    {claim.pendingClaim?.requestedAt && (
                      <> at {new Date(claim.pendingClaim.requestedAt).toLocaleString()}</>
                    )}
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  {claim.orderId && (
                    <>
                      <Button
                        variant='default'
                        disabled={actionLoading === claim.id + 'accept'}
                        onClick={() => handleAction(claim.id, claim.orderId!, 'accept')}
                      >
                        {actionLoading === claim.id + 'accept' ? 'Accepting...' : 'Accept'}
                      </Button>
                      <Button
                        variant='destructive'
                        disabled={actionLoading === claim.id + 'decline'}
                        onClick={() => handleAction(claim.id, claim.orderId!, 'decline')}
                      >
                        {actionLoading === claim.id + 'decline' ? 'Declining...' : 'Decline'}
                      </Button>
                    </>
                  )}
                  {hasClaimer && claim.pendingClaim && claim.pendingClaim.user && (
                    <Button
                      variant="outline"
                      size="sm"
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      onClick={() => handleMessageClick(claim.pendingClaim!.user!.id, claim.id)}
                      disabled={loadingMessageId === claim.id}
                    >
                      {loadingMessageId === claim.id ? 'Loading...' : 'Message'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Ordering;