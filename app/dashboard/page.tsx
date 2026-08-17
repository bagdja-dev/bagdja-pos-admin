'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '../components/loading-spinner';
import { NoBusinessState } from '../components/no-business-state';
import { useBusinessContext } from '../context/business-context';
import { apiClient } from '../lib/api-client';

interface ShortcutItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: React.ReactNode;
}

// Kotak pintasan aksi cepat dari dashboard — bukan navigasi utama (itu tugas
// sidebar), jadi cukup aksi-aksi yang paling sering dipakai lintas peran.
const shortcuts: ShortcutItem[] = [
  {
    titleKey: 'penjualanTitle',
    descKey: 'penjualanDesc',
    href: '/dashboard/invoices/new?type=sale',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
    ),
  },
  {
    titleKey: 'pembelianTitle',
    descKey: 'pembelianDesc',
    href: '/dashboard/invoices/new?type=purchase',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M16.5 14.25a3 3 0 0 1 3 3H3.75m12.75-3-2.394-8.978m-9.356 0L7.5 14.25M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-3.5-4.5L9.75 2.25l-5.5 13.5h11Z"
        />
      </svg>
    ),
  },
  {
    titleKey: 'returTitle',
    descKey: 'returDesc',
    href: '/dashboard/invoices/return/new',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
    ),
  },
  {
    titleKey: 'mutasiTitle',
    descKey: 'mutasiDesc',
    href: '/dashboard/invoices/new?type=transfer',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
  },
  {
    titleKey: 'tukarTambahTitle',
    descKey: 'tukarTambahDesc',
    href: '/dashboard/invoice-pairs/new',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M7.977 14.652H2.985v.001m0 0 3.181-3.183a8.25 8.25 0 0 1 13.803 3.7M19.969 14.135a8.25 8.25 0 0 0-13.803 3.7l-3.181-3.182M8.25 6.75l4.5 4.5m0 0 4.5-4.5m-4.5 4.5V21"
        />
      </svg>
    ),
  },
  {
    titleKey: 'debtNoteTitle',
    descKey: 'debtNoteDesc',
    href: '/dashboard/invoices/debt-note/new',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 1 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
        />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { loading, activeMembership } = useBusinessContext();
  const t = useTranslations('dashboard');
  const tRoles = useTranslations('roles');

  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const subscriptions = await apiClient<any[]>('/api/subscriptions/my');
        setHasSubscription(Array.isArray(subscriptions) && subscriptions.length > 0);
      } catch (err) {
        console.error('Failed to check subscription:', err);
        // Assume no subscription on error (user can manually subscribe)
        setHasSubscription(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (!loading) {
      void checkSubscription();
    }
  }, [loading]);

  const handleSubscribeFree = async () => {
    setSubscribing(true);
    try {
      const result = await apiClient<any>('/api/subscriptions/auto-subscribe-free', {
        method: 'POST',
      });

      if (result.autoSubscribed) {
        // Successfully subscribed
        setHasSubscription(true);
      } else {
        // Failed to auto-subscribe, redirect to subscription management
        window.location.href = '/dashboard/subscription';
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      // Redirect to subscription management page for manual subscribe
      window.location.href = '/dashboard/subscription';
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!activeMembership) return <NoBusinessState />;

  const { business, role, location } = activeMembership;

  return (
    <div className="space-y-6">
      {/* Fallback: No subscription banner */}
      {!checkingSubscription && !hasSubscription && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                Daftar ke Paket Gratis Bagdja POS
              </p>
              <p className="mt-1 text-sm text-amber-800">
                Dapatkan akses penuh ke fitur kasir, stok, dan laporan dengan paket gratis. Tanpa biaya tersembunyi.
              </p>
            </div>
            <Button
              color="warning"
              size="sm"
              isLoading={subscribing}
              onPress={handleSubscribeFree}
              className="shrink-0"
            >
              Daftar Sekarang
            </Button>
          </div>
        </div>
      )}

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
