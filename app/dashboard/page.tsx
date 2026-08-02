'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '../components/loading-spinner';
import { NoBusinessState } from '../components/no-business-state';
import { useBusinessContext } from '../context/business-context';

interface ShortcutItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: React.ReactNode;
}

// Kotak pintasan aksi cepat dari dashboard — bukan navigasi utama (itu tugas
// sidebar), jadi cukup satu-dua aksi yang paling sering dipakai lintas peran.
const shortcuts: ShortcutItem[] = [
  {
    titleKey: 'debtNoteTitle',
    descKey: 'debtNoteDesc',
    href: '/dashboard/invoices/debt-note/new',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
        />
      </svg>
    ),
  },
];

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

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card shadow="sm">
          <CardHeader className="pb-0 text-[11px] font-medium text-default-500 sm:text-sm">{t('yourRole')}</CardHeader>
          <CardBody className="text-sm font-semibold sm:text-lg">{tRoles(role)}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-[11px] font-medium text-default-500 sm:text-sm">{t('lockedLocation')}</CardHeader>
          <CardBody className="text-sm font-semibold sm:text-lg">{location?.name ?? t('allLocations')}</CardBody>
        </Card>
        <Card shadow="sm">
          <CardHeader className="pb-0 text-[11px] font-medium text-default-500 sm:text-sm">{t('businessStatus')}</CardHeader>
          <CardBody className="text-sm font-semibold sm:text-lg">{business.is_active ? t('active') : t('inactive')}</CardBody>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-default-500">{t('shortcutsTitle')}</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-default-200 bg-default-50 p-4 text-center transition-colors hover:bg-default-100"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                {shortcut.icon}
              </div>
              <span className="text-xs font-medium leading-tight text-foreground">{t(shortcut.titleKey)}</span>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-default-400">{t('hint')}</p>
    </div>
  );
}
