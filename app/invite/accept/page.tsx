'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/react';

import { apiClient, ApiError } from '../../lib/api-client';
import { useAuth } from '../../hooks/use-auth';

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      const next = encodeURIComponent(`/invite/accept?token=${token ?? ''}`);
      router.replace(`/auth/login?next=${next}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setError('Token undangan tidak ditemukan di URL.');
      return;
    }

    if (status === 'idle') {
      setStatus('accepting');
      apiClient('/api/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
        .then(() => setStatus('done'))
        .catch((err) => {
          setStatus('error');
          setError(err instanceof ApiError ? err.message : 'Gagal menerima undangan');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn, token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      {status === 'accepting' && <p>Memproses undangan untuk {user?.email}...</p>}
      {status === 'done' && (
        <>
          <p className="text-lg font-semibold text-success-600">Undangan diterima!</p>
          <Button color="primary" onPress={() => router.push('/dashboard')}>
            Masuk ke Dashboard
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-lg font-semibold text-danger">Gagal menerima undangan</p>
          <p className="text-sm text-default-500">{error}</p>
        </>
      )}
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}
