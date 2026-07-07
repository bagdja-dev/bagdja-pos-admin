'use client';

import { Card, CardBody, CardHeader } from '@heroui/react';

import { LoadingSpinner } from '../components/loading-spinner';
import { NoBusinessState } from '../components/no-business-state';
import { useBusinessContext } from '../context/business-context';
import { ROLE_LABELS } from '../lib/types';

export default function DashboardPage() {
  const { loading, activeMembership } = useBusinessContext();

  if (loading) return <LoadingSpinner />;
  if (!activeMembership) return <NoBusinessState />;

  const { business, role, location } = activeMembership;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        <p className="text-sm text-default-500">Dashboard bisnis Anda</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">Peran Anda</CardHeader>
          <CardBody className="text-lg font-semibold">{ROLE_LABELS[role]}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">Lokasi Terkunci</CardHeader>
          <CardBody className="text-lg font-semibold">{location?.name ?? 'Semua lokasi (Owner/Manager)'}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">Status Bisnis</CardHeader>
          <CardBody className="text-lg font-semibold">{business.is_active ? 'Aktif' : 'Nonaktif'}</CardBody>
        </Card>
      </div>

      <p className="text-sm text-default-400">
        Gunakan menu di sidebar untuk kelola Lokasi, Produk, Jasa, Kontak, Faktur, dan Tim.
      </p>
    </div>
  );
}
