'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import Link from 'next/link';

import { formatCurrency } from '../lib/currency';

interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingInterval: string;
  intervalCount: number;
  features: { list?: string[] } | Record<string, unknown> | string[] | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
}

type IntervalTab = 'MONTHLY' | 'YEARLY';

function featureList(features: SubscriptionPlan['features']): string[] {
  if (!features) return [];
  if (Array.isArray(features)) {
    return features.map(String).filter(Boolean);
  }
  if (typeof features === 'object' && Array.isArray((features as { list?: string[] }).list)) {
    return ((features as { list: string[] }).list || []).map(String).filter(Boolean);
  }
  return Object.entries(features)
    .filter(([k]) => k !== 'list')
    .map(([k, v]) => (typeof v === 'boolean' ? (v ? k : null) : `${k}: ${String(v)}`))
    .filter((x): x is string => Boolean(x));
}

function formatInterval(interval: string, count: number): string {
  const labels: Record<string, string> = {
    DAILY: 'hari',
    WEEKLY: 'minggu',
    MONTHLY: 'bulan',
    YEARLY: 'tahun',
  };
  const unit = labels[interval] || interval.toLowerCase();
  return count === 1 ? `/ ${unit}` : `/ ${count} ${unit}`;
}

/** Kunci pasangan bulanan↔tahunan: metadata.tier / code tanpa suffix interval / nama. */
function familyKey(plan: SubscriptionPlan): string {
  const meta = plan.metadata;
  if (meta && typeof meta.tier === 'string' && meta.tier.trim()) {
    return meta.tier.trim().toLowerCase();
  }
  if (meta && typeof meta.family === 'string' && meta.family.trim()) {
    return meta.family.trim().toLowerCase();
  }
  const code = (plan.code || '')
    .toLowerCase()
    .replace(/[-_]?(monthly|yearly|bulan|tahun|bln|thn)$/i, '')
    .replace(/[-_]?(month|year)$/i, '');
  if (code) return code;
  return (plan.name || '').trim().toLowerCase();
}

function isStandardInterval(plan: SubscriptionPlan, interval: IntervalTab): boolean {
  return plan.billingInterval === interval && (plan.intervalCount || 1) === 1;
}

function yearlySavingsNote(
  monthly: SubscriptionPlan,
  yearly: SubscriptionPlan,
): string | null {
  const m = Number(monthly.price);
  const y = Number(yearly.price);
  if (!(m > 0) || !(y >= 0)) return null;
  const fullYear = m * 12;
  if (y >= fullYear) return null;
  const saved = fullYear - y;
  const monthsEquiv = y / m;
  const monthsLabel =
    Number.isInteger(monthsEquiv) || Math.abs(monthsEquiv - Math.round(monthsEquiv)) < 0.05
      ? String(Math.round(monthsEquiv))
      : monthsEquiv.toFixed(1);
  return `Hemat dengan paket tahunan — setara ${monthsLabel} bulan (hemat ${formatCurrency(saved, monthly.currency || 'IDR')}/tahun)`;
}

type TierAccent = {
  badge: string;
  icon: string;
  ring: string;
  glow: string;
  cta: string;
};

/**
 * Aksen warna dekoratif berbasis URUTAN HARGA (termurah→termahal) di antara
 * plan yang sedang ditampilkan — bukan berdasarkan nama plan, supaya tetap
 * benar berapa pun jumlah/nama plan yang dikirim API.
 */
function tierAccent(index: number, total: number): TierAccent {
  const isTop = total <= 1 || index === total - 1;
  const isEntry = !isTop && index === 0;
  if (isTop) {
    return {
      badge: 'bg-amber-100 text-amber-700',
      icon: 'bg-gradient-to-br from-amber-400 to-orange-500',
      ring: 'ring-amber-400',
      glow: 'shadow-amber-500/20',
      cta: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    };
  }
  if (isEntry) {
    return {
      badge: 'bg-slate-100 text-slate-600',
      icon: 'bg-gradient-to-br from-slate-400 to-slate-500',
      ring: 'ring-slate-300',
      glow: 'shadow-slate-500/10',
      cta: 'border-slate-300 text-slate-700 hover:bg-slate-50',
    };
  }
  return {
    badge: 'bg-violet-100 text-violet-700',
    icon: 'bg-gradient-to-br from-violet-500 to-purple-500',
    ring: 'ring-violet-400',
    glow: 'shadow-violet-500/20',
    cta: 'border-violet-300 text-violet-700 hover:bg-violet-50',
  };
}

/**
 * Section `#pricing` landing — data dari payment-service lewat
 * `GET /api/public/subscription-plans` (plan aktif `appId=bagdja-pos`).
 * Dikelompokkan Bulanan/Tahunan lewat toggle; kartu bulanan menampilkan
 * catatan hemat tahunan jika ada pasangan plan yang lebih murah.
 */
export function LandingPricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<IntervalTab>('MONTHLY');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/public/subscription-plans');
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(body?.message || `Gagal memuat paket (${res.status})`);
        }
        const data = (await res.json()) as SubscriptionPlan[];
        if (!cancelled) {
          setPlans(Array.isArray(data) ? data.filter((p) => p.isActive !== false) : []);
        }
      } catch (err) {
        if (!cancelled) {
          setPlans([]);
          setError(err instanceof Error ? err.message : 'Gagal memuat paket');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasMonthly = useMemo(
    () => plans.some((p) => isStandardInterval(p, 'MONTHLY')),
    [plans],
  );
  const hasYearly = useMemo(
    () => plans.some((p) => isStandardInterval(p, 'YEARLY')),
    [plans],
  );

  // Kalau cuma satu sisi yang ada, kunci toggle ke sisi itu.
  useEffect(() => {
    if (hasMonthly && !hasYearly) setTab('MONTHLY');
    else if (!hasMonthly && hasYearly) setTab('YEARLY');
  }, [hasMonthly, hasYearly]);

  const yearlyByFamily = useMemo(() => {
    const map = new Map<string, SubscriptionPlan>();
    for (const p of plans) {
      if (isStandardInterval(p, 'YEARLY')) {
        map.set(familyKey(p), p);
      }
    }
    return map;
  }, [plans]);

  const visiblePlans = useMemo(() => {
    return plans
      .filter((p) => isStandardInterval(p, tab))
      .sort((a, b) => Number(a.price) - Number(b.price));
  }, [plans, tab]);

  const highlightedId = useMemo(() => {
    if (visiblePlans.length === 0) return null;
    const fromMeta = visiblePlans.find((p) => p.metadata?.highlight === true);
    if (fromMeta) return fromMeta.id;
    // Highlight harga tertinggi di tab aktif (kecuali semua gratis).
    const paid = visiblePlans.filter((p) => Number(p.price) > 0);
    const pool = paid.length > 0 ? paid : visiblePlans;
    return [...pool].sort((a, b) => Number(b.price) - Number(a.price))[0]?.id ?? null;
  }, [visiblePlans]);

  const showToggle = hasMonthly && hasYearly;

  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 px-4 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-pulse-glow pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
            Iuran
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Iuran{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              Transparan
            </span>
            , Tanpa Biaya Tersembunyi
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
            Pilih paket yang sesuai kebutuhan toko Anda. Biaya dipotong dari saldo Bagdja setelah
            Anda berlangganan — tanpa checkout kartu tersembunyi.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {error}
          </div>
        ) : plans.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
            Belum ada paket aktif. Silakan hubungi admin Bagdja atau coba lagi nanti.
          </div>
        ) : (
          <>
            {showToggle && (
              <div className="mb-12 flex justify-center">
                <div
                  role="tablist"
                  aria-label="Pilih siklus iuran"
                  className="inline-flex rounded-full border border-gray-200 bg-white p-1.5 shadow-md"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'MONTHLY'}
                    onClick={() => setTab('MONTHLY')}
                    className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                      tab === 'MONTHLY'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'YEARLY'}
                    onClick={() => setTab('YEARLY')}
                    className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                      tab === 'YEARLY'
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tahunan
                    <span
                      className={`ml-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        tab === 'YEARLY'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11.3 1.046A1 1 0 0 1 12 2v6h4a1 1 0 0 1 .82 1.573l-7 10A1 1 0 0 1 8 19v-6H4a1 1 0 0 1-.82-1.573l7-10a1 1 0 0 1 1.12-.38Z" />
                      </svg>
                      Hemat
                    </span>
                  </button>
                </div>
              </div>
            )}

            {visiblePlans.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500">
                Belum ada paket {tab === 'MONTHLY' ? 'bulanan' : 'tahunan'}.
              </div>
            ) : (
              <div
                className={`grid gap-8 auto-rows-max ${
                  visiblePlans.length === 1
                    ? 'mx-auto max-w-md sm:grid-cols-1'
                    : visiblePlans.length === 2
                      ? 'mx-auto max-w-3xl sm:grid-cols-2'
                      : 'sm:grid-cols-2 lg:grid-cols-3'
                } [&>div]:h-full`}
              >
                {visiblePlans.map((plan, index) => {
                  const highlight = plan.id === highlightedId;
                  const accent = tierAccent(index, visiblePlans.length);
                  const features = featureList(plan.features);
                  const yearlyTwin =
                    tab === 'MONTHLY' ? yearlyByFamily.get(familyKey(plan)) : undefined;
                  const savings =
                    yearlyTwin && Number(plan.price) > 0
                      ? yearlySavingsNote(plan, yearlyTwin)
                      : null;

                  return (
                    <div
                      key={plan.id}
                      className={`feature-card relative flex flex-col rounded-2xl border p-8 transition-transform h-full ${
                        highlight
                          ? `border-transparent bg-white shadow-2xl ${accent.glow} ring-2 ${accent.ring} sm:scale-105`
                          : 'border-gray-100 bg-white shadow-sm'
                      }`}
                    >
                      {highlight && (
                        <span className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-500/30">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 1l2.6 5.6 6.2.6-4.7 4.1 1.4 6.1L10 14.9l-5.5 3.5 1.4-6.1L1.2 7.2l6.2-.6L10 1Z" />
                          </svg>
                          Paling Direkomendasikan
                        </span>
                      )}

                      <div
                        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${accent.icon}`}
                      >
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <span
                        className={`mb-2 inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${accent.badge}`}
                      >
                        {tab === 'MONTHLY' ? 'Bulanan' : 'Tahunan'}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span
                          className={`font-extrabold text-gray-900 ${highlight ? 'text-4xl' : 'text-3xl'}`}
                        >
                          {formatCurrency(plan.price, plan.currency || 'IDR')}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {formatInterval(plan.billingInterval, plan.intervalCount || 1)}
                        </span>
                      </div>
                      {plan.description && (
                        <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                      )}

                      {savings && (
                        <button
                          type="button"
                          onClick={() => setTab('YEARLY')}
                          className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                          {savings}
                          <span className="mt-0.5 block text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline">
                            Lihat paket tahunan →
                          </span>
                        </button>
                      )}

                      {features.length > 0 && (
                        <ul className="mt-6 space-y-3 text-sm text-gray-600">
                          {features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <svg
                                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                                  highlight ? 'text-violet-500' : 'text-gray-400'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        as={Link}
                        href="/auth/login"
                        fullWidth
                        className={`mt-8 font-semibold transition-transform hover:scale-[1.02] py-3 ${
                          highlight
                            ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg shadow-violet-500/25'
                            : `border bg-white ${accent.cta}`
                        }`}
                        variant={highlight ? 'solid' : 'bordered'}
                      >
                        Mulai Berlangganan
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-gray-400">
          Setelah login, kelola langganan di menu Subscription. Tagihan otomatis dipotong dari saldo
          personal Anda sesuai siklus paket.
        </p>
      </div>
    </section>
  );
}
