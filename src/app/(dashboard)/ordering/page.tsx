"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Claim {
  id: string;
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

  const handleAction = async (listingId: string, action: 'accept' | 'decline') => {
    setActionLoading(listingId + action);
    try {
      const res = await fetch(`/api/listings/${listingId}/review-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
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

  if (loading) return <div className='p-8 text-center'>Loading claims...</div>;
  if (error) return <div className='p-8 text-center text-red-500'>{error}</div>;

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Pending Claims</h1>
      {claims.length === 0 ? (
        <div className='text-gray-500'>No pending claims.</div>
      ) : (
        <div className='space-y-6'>
          {claims.map((claim) => (
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
                {claim.pendingClaim?.user && (
                  <div className='flex items-center gap-2 mt-1'>
                    <Image
                      src={claim.pendingClaim.user.avatar || '/default-avatar.png'}
                      alt={claim.pendingClaim.user.name}
                      width={32}
                      height={32}
                      className='rounded-full object-cover'
                    />
                    <span>{claim.pendingClaim.user.name}</span>
                  </div>
                )}
                <div className='text-xs text-gray-500 mt-1'>
                  Requested
                  {claim.pendingClaim?.user?.name && (
                    <> by <span className="font-medium text-gray-700">{claim.pendingClaim.user.name}</span></>
                  )}
                  {claim.pendingClaim?.requestedAt && (
                    <> at {new Date(claim.pendingClaim.requestedAt).toLocaleString()}</>
                  )}
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Button
                  variant='default'
                  disabled={actionLoading === claim.id + 'accept'}
                  onClick={() => handleAction(claim.id, 'accept')}
                >
                  {actionLoading === claim.id + 'accept' ? 'Accepting...' : 'Accept'}
                </Button>
                <Button
                  variant='destructive'
                  disabled={actionLoading === claim.id + 'decline'}
                  onClick={() => handleAction(claim.id, 'decline')}
                >
                  {actionLoading === claim.id + 'decline' ? 'Declining...' : 'Decline'}
                </Button>
                {claim.pendingClaim?.user?.id && (
                  <Button
                    variant='outline'
                    onClick={() => router.push(`/messages/${[claim.pendingClaim?.user?.id, claim.id].sort().join('_')}`)}
                  >
                    Message
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ordering;