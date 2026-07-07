'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import type { PosBusiness } from '../../../lib/types';

export default function NewBusinessPage() {
  const router = useRouter();
  const { refresh, switchBusiness } = useBusinessContext();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const business = await apiClient<PosBusiness>('/api/businesses', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      await refresh();
      switchBusiness(business.id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat bisnis');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Buat Bisnis Baru</h1>
      <p className="mb-6 text-sm text-default-500">
        Anda akan otomatis jadi <span className="font-medium">Owner</span> dari bisnis ini. Lokasi, produk, dan
        staff diisi manual setelah bisnis dibuat.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="business-name" className="block text-sm font-medium text-default-700 mb-1">
            Nama Bisnis
          </label>
          <input
            id="business-name"
            name="business-name"
            type="text"
            placeholder="Bengkel Jaya Motor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="block w-full rounded-md border border-default-200 bg-background px-3 py-2 text-sm placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" color="primary" fullWidth isLoading={submitting}>
          Buat Bisnis
        </Button>
      </form>
    </div>
  );
}
