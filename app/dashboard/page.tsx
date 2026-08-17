'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslations } from 'next-intl';

import { LoadingSpinner } from '../components/loading-spinner';
import { NoBusinessState } from '../components/no-business-state';
import { useBusinessContext } from '../context/business-context';
import { apiClient, ApiError } from '../lib/api-client';
import { formatCurrency as formatMoney } from '../lib/currency';

interface ShortcutItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: React.ReactNode;
}

interface TrendPoint {
  bucket: string;
  amount: number;
  cashIn?: number;
  cashOut?: number;
}

interface TrendReport {
  metric: 'revenue' | 'cash';
  granularity: 'daily' | 'monthly';
  range: 'month' | 'year';
  total: number;
  peak: { bucket: string; amount: number };
  points: TrendPoint[];
}

type TrendKey = 'revenueDaily' | 'cashDaily' | 'revenueMonthly' | 'cashMonthly';

const TREND_REQUESTS: Record<TrendKey, { metric: string; granularity: string; range: string }> = {
  revenueDaily: { metric: 'revenue', granularity: 'daily', range: 'month' },
  cashDaily: { metric: 'cash', granularity: 'daily', range: 'month' },
  revenueMonthly: { metric: 'revenue', granularity: 'monthly', range: 'year' },
  cashMonthly: { metric: 'cash', granularity: 'monthly', range: 'year' },
};

interface FinancialSummaryReport {
  kasBersih: number;
  totalPiutang: number;
  totalHutang: number;
  kasBreakdown: { cashIn: number; cashOut: number };
}

type PieSegmentKey = 'kas' | 'piutang' | 'hutang';
const PIE_COLORS: Record<PieSegmentKey, { fill: string; text: string; dot: string; label: string }> = {
  kas: {
    fill: '#006FEE',
    text: 'text-primary',
    dot: 'bg-primary',
    label: 'Kas Bersih',
  },
  piutang: {
    fill: '#F5A524',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Piutang',
  },
  hutang: {
    fill: '#F31260',
    text: 'text-danger',
    dot: 'bg-danger',
    label: 'Hutang',
  },
};

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

function shortenLabel(bucket: string, granularity: 'daily' | 'monthly'): string {
  if (granularity === 'daily') {
    const parts = bucket.split('-');
    return parts[2] ?? bucket;
  }
  const m = Number(bucket.split('-')[1] ?? '1');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return names[m - 1] ?? bucket;
}

function TrendBar({
  report,
  colorClass,
}: {
  report: TrendReport;
  colorClass: string;
}) {
  const { points, granularity } = report;
  const max = useMemo(() => {
    let m = 0;
    for (const p of points) if (p.amount > m) m = p.amount;
    return m || 1;
  }, [points]);

  const maxBars = 16;
  const step = Math.max(1, Math.ceil(points.length / maxBars));
  const visible = points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);

  return (
    <div className="flex h-20 items-end gap-[2px] overflow-hidden">
      {visible.map((p) => {
        const h = Math.max(2, Math.round((p.amount / max) * 100));
        return (
          <div
            key={p.bucket}
            className="group relative flex flex-1 flex-col items-center"
            title={`${shortenLabel(p.bucket, granularity)}: ${formatMoney(p.amount)}`}
          >
            <div
              className={`w-full rounded-t-md ${colorClass} transition-all`}
              style={{ height: `${h}%`, minHeight: '2px' }}
            />
          </div>
        );
      })}
    </div>
  );
}

function TrendBarLabels({ report }: { report: TrendReport }) {
  const { points, granularity } = report;
  const maxBars = 16;
  const step = Math.max(1, Math.ceil(points.length / maxBars));
  const visible = points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);

  return (
    <div className="mt-1 flex gap-[2px] text-[8px] leading-none text-default-400 sm:text-[10px]">
      {visible.map((p) => (
        <div key={p.bucket} className="flex-1 text-center">
          {shortenLabel(p.bucket, granularity)}
        </div>
      ))}
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  total,
  peak,
  report,
  currency,
  locale,
  loading,
  accent = 'primary',
}: {
  title: string;
  subtitle: string;
  total: number;
  peak: { bucket: string; amount: number } | null;
  report: TrendReport | null;
  currency?: string;
  locale?: string;
  loading: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'secondary';
}) {
  const accentBg = {
    primary: 'bg-primary/80',
    success: 'bg-success/80',
    warning: 'bg-warning/70',
    secondary: 'bg-secondary/80',
  }[accent];
  const accentText = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    secondary: 'text-secondary',
  }[accent];

  return (
    <Card shadow="sm">
      <CardHeader className="flex flex-col items-start gap-0 pb-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-default-500 sm:text-xs">{title}</p>
        <p className="text-[10px] text-default-400 sm:text-[11px]">{subtitle}</p>
      </CardHeader>
      <CardBody className="space-y-2 pt-1">
        {loading ? (
          <div className="flex h-[120px] items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-default-200 border-t-primary" />
          </div>
        ) : report ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className={`text-lg font-bold ${accentText} sm:text-2xl`}>{formatMoney(total, currency, locale)}</p>
            </div>
            {peak && peak.amount > 0 && (
              <p className="text-[10px] text-default-500 sm:text-xs">
                <span className="font-semibold text-default-700">Tertinggi:</span>{' '}
                {shortenLabel(peak.bucket, report.granularity)} — {formatMoney(peak.amount, currency, locale)}
              </p>
            )}
            <TrendBar report={report} colorClass={accentBg} />
            <TrendBarLabels report={report} />
          </>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-default-400">
            Belum ada data
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function FinancialPieChart({
  summary,
  currency,
  locale,
  loading,
}: {
  summary: FinancialSummaryReport | null;
  currency?: string;
  locale?: string;
  loading: boolean;
}) {
  const segments: Array<{ key: PieSegmentKey; value: number }> = useMemo(() => {
    const kas = Math.max(0, summary?.kasBersih ?? 0);
    const piutang = Math.max(0, summary?.totalPiutang ?? 0);
    const hutang = Math.max(0, summary?.totalHutang ?? 0);
    return [
      { key: 'kas', value: kas },
      { key: 'piutang', value: piutang },
      { key: 'hutang', value: hutang },
    ];
  }, [summary]);

  const total = useMemo(() => segments.reduce((acc, s) => acc + s.value, 0), [segments]);

  const { gradientParts, percentages } = useMemo(() => {
    if (total <= 0) {
      return {
        gradientParts: '#e5e7eb 0% 100%',
        percentages: { kas: 0, piutang: 0, hutang: 0 } as Record<PieSegmentKey, number>,
      };
    }
    const pcts: Record<PieSegmentKey, number> = { kas: 0, piutang: 0, hutang: 0 };
    let acc = 0;
    const parts: string[] = [];
    for (const s of segments) {
      const p = (s.value / total) * 100;
      pcts[s.key] = Math.round(p * 100) / 100;
      const start = acc;
      acc += p;
      const end = acc;
      const color = PIE_COLORS[s.key].fill;
      parts.push(`${color} ${start}% ${end}%`);
    }
    return { gradientParts: parts.join(', '), percentages: pcts };
  }, [segments, total]);

  if (loading) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-default-200 border-t-primary" />
      </div>
    );
  }

  if (!summary || total <= 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-xs text-default-400">
        <div
          className="h-28 w-28 rounded-full"
          style={{ background: 'conic-gradient(#e5e7eb 0% 100%)' }}
        />
        Belum ada data finansial
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0">
        <div
          className="h-36 w-36 rounded-full sm:h-44 sm:w-44"
          style={{ background: `conic-gradient(${gradientParts})` }}
        />
        <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white dark:bg-default-50 sm:inset-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-default-500 sm:text-xs">Total</p>
          <p className="text-sm font-bold text-foreground sm:text-lg">{formatMoney(total, currency, locale)}</p>
        </div>
      </div>

      <div className="w-full flex-1 space-y-2">
        {segments.map((s) => {
          const color = PIE_COLORS[s.key];
          const pct = percentages[s.key];
          return (
            <div key={s.key} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 shrink-0 rounded-full ${color.dot}`} />
                <span className={`text-[11px] font-medium sm:text-sm ${color.text}`}>{color.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-default-700 sm:text-sm">
                  {formatMoney(s.value, currency, locale)}
                </span>
                <span className="text-[10px] font-bold text-default-500 sm:text-xs">{pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
        <div className="mt-2 border-t border-default-200 pt-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-default-500 sm:text-xs">Kas Masuk / Keluar</span>
            <span className="text-[10px] text-default-500 sm:text-xs">
              <span className="text-success">{formatMoney(summary.kasBreakdown.cashIn, currency, locale)}</span>
              {' / '}
              <span className="text-danger">{formatMoney(summary.kasBreakdown.cashOut, currency, locale)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { loading, activeMembership, businessId } = useBusinessContext();
  const t = useTranslations('dashboard');
  const tRoles = useTranslations('roles');
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  const [trends, setTrends] = useState<Record<TrendKey, TrendReport | null>>({
    revenueDaily: null,
    cashDaily: null,
    revenueMonthly: null,
    cashMonthly: null,
  });
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryReport | null>(null);
  const [finSummaryLoading, setFinSummaryLoading] = useState(true);
  const [finSummaryError, setFinSummaryError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    if (!businessId) return;
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const keys: TrendKey[] = ['revenueDaily', 'cashDaily', 'revenueMonthly', 'cashMonthly'];
      const result = await Promise.all(
        keys.map(async (k) => {
          const r = TREND_REQUESTS[k];
          const qs = new URLSearchParams({
            metric: r.metric,
            granularity: r.granularity,
            range: r.range,
          });
          return [k, await apiClient<TrendReport>(`/api/businesses/${businessId}/reports/trends?${qs.toString()}`)] as const;
        }),
      );
      const next: Record<TrendKey, TrendReport | null> = {
        revenueDaily: null,
        cashDaily: null,
        revenueMonthly: null,
        cashMonthly: null,
      };
      for (const [k, v] of result) next[k] = v;
      setTrends(next);
    } catch (err) {
      setTrendsError(err instanceof ApiError ? err.message : 'Gagal memuat statistik');
    } finally {
      setTrendsLoading(false);
    }
  }, [businessId]);

  const fetchFinancialSummary = useCallback(async () => {
    if (!businessId) return;
    setFinSummaryLoading(true);
    setFinSummaryError(null);
    try {
      const res = await apiClient<FinancialSummaryReport>(
        `/api/businesses/${businessId}/reports/financial-summary`,
      );
      setFinancialSummary(res);
    } catch (err) {
      setFinSummaryError(err instanceof ApiError ? err.message : 'Gagal memuat ringkasan finansial');
    } finally {
      setFinSummaryLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const subscriptions = await apiClient<any[]>('/api/subscriptions/my');
        setHasSubscription(Array.isArray(subscriptions) && subscriptions.length > 0);
      } catch (err) {
        console.error('Failed to check subscription:', err);
        setHasSubscription(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    if (!loading) {
      void checkSubscription();
      void fetchTrends();
      void fetchFinancialSummary();
    }
  }, [loading, fetchTrends, fetchFinancialSummary]);

  const handleSubscribeFree = async () => {
    setSubscribing(true);
    try {
      const result = await apiClient<any>('/api/subscriptions/auto-subscribe-free', {
        method: 'POST',
      });

      if (result.autoSubscribed) {
        setHasSubscription(true);
      } else {
        window.location.href = '/dashboard/subscription';
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      window.location.href = '/dashboard/subscription';
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!activeMembership) return <NoBusinessState />;

  const { business, role, location } = activeMembership;
  const currency = business.currency;
  const locale = business.locale;
  const now = new Date();
  const monthLabel = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const yearLabel = `${now.getFullYear()}`;

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

      <div className="space-y-3">
        {trendsError && (
          <p className="text-xs text-danger sm:text-sm">{trendsError}</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            title="Omset Harian"
            subtitle={`Bulan ${monthLabel}`}
            total={trends.revenueDaily?.total ?? 0}
            peak={trends.revenueDaily?.peak ?? null}
            report={trends.revenueDaily}
            currency={currency}
            locale={locale}
            loading={trendsLoading}
            accent="success"
          />
          <StatCard
            title="Kas Harian"
            subtitle={`Bulan ${monthLabel}`}
            total={trends.cashDaily?.total ?? 0}
            peak={trends.cashDaily?.peak ?? null}
            report={trends.cashDaily}
            currency={currency}
            locale={locale}
            loading={trendsLoading}
            accent="primary"
          />
          <StatCard
            title="Omset Bulanan"
            subtitle={`Tahun ${yearLabel}`}
            total={trends.revenueMonthly?.total ?? 0}
            peak={trends.revenueMonthly?.peak ?? null}
            report={trends.revenueMonthly}
            currency={currency}
            locale={locale}
            loading={trendsLoading}
            accent="secondary"
          />
          <StatCard
            title="Kas Bulanan"
            subtitle={`Tahun ${yearLabel}`}
            total={trends.cashMonthly?.total ?? 0}
            peak={trends.cashMonthly?.peak ?? null}
            report={trends.cashMonthly}
            currency={currency}
            locale={locale}
            loading={trendsLoading}
            accent="warning"
          />
        </div>
      </div>

      <div className="space-y-3">
        {finSummaryError && (
          <p className="text-xs text-danger sm:text-sm">{finSummaryError}</p>
        )}
        <Card shadow="sm">
          <CardHeader className="flex flex-col items-start gap-0 pb-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-default-500 sm:text-xs">
              Komposisi Aset
            </p>
            <p className="text-[10px] text-default-400 sm:text-[11px]">
              Kas bersih, piutang, dan hutang seumur hidup
            </p>
          </CardHeader>
          <CardBody className="pt-1">
            <FinancialPieChart
              summary={financialSummary}
              currency={currency}
              locale={locale}
              loading={finSummaryLoading}
            />
          </CardBody>
        </Card>
      </div>

      <p className="text-sm text-default-400">{t('hint')}</p>
    </div>
  );
}
