'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '../components/loading-spinner';
import { NoBusinessState } from '../components/no-business-state';
import { useBusinessContext } from '../context/business-context';

export default function DashboardPage() {
  const { loading, activeMembership } = useBusinessContext();
  const t = useTranslations('dashboard');
  const tRoles = useTranslations('roles');

  if (loading) return <LoadingSpinner />;
  if (!activeMembership) return <NoBusinessState />;

  const { business, role, location } = activeMembership;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
        <p className="text-sm text-default-500">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">{t('yourRole')}</CardHeader>
          <CardBody className="text-lg font-semibold">{tRoles(role)}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">{t('lockedLocation')}</CardHeader>
          <CardBody className="text-lg font-semibold">{location?.name ?? t('allLocations')}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-sm font-medium text-default-500">{t('businessStatus')}</CardHeader>
          <CardBody className="text-lg font-semibold">{business.is_active ? t('active') : t('inactive')}</CardBody>
        </Card>
      </div>

      <Link href="/dashboard/invoices/debt-note/new" className="block">
        <Card shadow="sm" isPressable className="w-full sm:max-w-xs">
          <CardBody className="flex-row items-center gap-3">
            <div>
              <p className="font-semibold text-foreground">{t('debtNoteTitle')}</p>
              <p className="text-xs text-default-500">{t('debtNoteDesc')}</p>
            </div>
          </CardBody>
        </Card>
      </Link>

      <p className="text-sm text-default-400">{t('hint')}</p>
    </div>
  );
}
