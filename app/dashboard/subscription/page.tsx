'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { RefreshCw, Wallet as WalletIcon } from 'lucide-react';

import { AppModal } from '../../components/app-modal';
import { CurrencyInput } from '../../components/currency-input';
import { LoadingSpinner } from '../../components/loading-spinner';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, ApiError } from '../../lib/api-client';
import { formatCurrency } from '../../lib/currency';

interface WalletBalance {
  currency_code: string;
  balance: number;
  held_balance: number;
  is_active: boolean;
}

const MIN_TOPUP = 10000;

/**
 * Saldo personal milik USER yang login — SENGAJA tidak butuh business sama
 * sekali (koreksi 2026-08-10, lihat app/pos/plan/plan-integration-payment.md
 * §7). Halaman ini harus tetap bisa diakses walau user belum punya business.
 */
export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiClient<WalletBalance>('/api/wallet/balance');
      setWallet(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat saldo. Coba lagi.');
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    // Balik dari checkout (status=success/failure di query string) juga perlu refresh saldo.
    void loadWallet();
  }, [loadWallet, status]);

  async function handleTopup() {
    const numeric = Number(amount);
    if (!numeric || numeric < MIN_TOPUP) {
      setFormError(`Minimum topup ${formatCurrency(MIN_TOPUP, 'IDR')}`);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await apiClient<{ checkoutUrl: string }>('/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount: numeric }),
      });
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal memulai topup. Coba lagi.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <StickyHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
            <p className="text-sm text-default-500">Kelola saldo dan subscription Bagdja POS Anda.</p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={async () => {
              setRefreshing(true);
              await loadWallet();
              setRefreshing(false);
            }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </StickyHeader>

      {status === 'success' && (
        <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
          Pembayaran berhasil! Saldo Anda sudah diperbarui.
        </div>
      )}
      {status === 'failure' && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          Pembayaran gagal atau dibatalkan.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Saldo</span>
            </div>
            {wallet && (
              <Chip size="sm" color={wallet.is_active ? 'success' : 'default'}>
                {wallet.is_active ? 'Aktif' : 'Nonaktif'}
              </Chip>
            )}
          </CardHeader>
          <CardBody className="space-y-4">
            {loadingWallet ? (
              <LoadingSpinner className="h-20" />
            ) : loadError ? (
              <p className="text-sm text-danger">{loadError}</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-default-500">Saldo tersedia</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(wallet?.balance ?? 0, wallet?.currency_code ?? 'IDR')}
                  </p>
                </div>
                <Button color="primary" onPress={() => setTopupOpen(true)}>
                  Topup
                </Button>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <span className="font-semibold text-foreground">Plan</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-default-500">Segera hadir.</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <span className="font-semibold text-foreground">Riwayat Pembayaran</span>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-default-500">
            Riwayat pembayaran subscription dan status recurring akan muncul di sini.
          </p>
        </CardBody>
      </Card>

      <AppModal
        isOpen={topupOpen}
        onClose={() => {
          setTopupOpen(false);
          setAmount('');
          setFormError(null);
        }}
        title="Topup Saldo"
        footer={
          <>
            <Button variant="flat" onPress={() => setTopupOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={submitting} onPress={handleTopup}>
              Lanjut ke Pembayaran
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <CurrencyInput label="Jumlah" value={amount} onValueChange={setAmount} isRequired />
          <p className="text-xs text-default-400">Minimum topup {formatCurrency(MIN_TOPUP, 'IDR')}</p>
          {formError && <p className="text-sm text-danger">{formError}</p>}
        </div>
      </AppModal>
    </div>
  );
}
