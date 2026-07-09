'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';

import { LandingNavbar } from './components/landing-navbar';

const features = [
  {
    title: 'Faktur Unified',
    desc: 'Jual, beli, dan mutasi antar lokasi dalam satu alur faktur. Retur & tukar barang terhubung langsung ke faktur asal.',
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    title: 'Multi-Cabang & Multi-Staff',
    desc: 'Kelola banyak toko/gudang dari satu akun. Undang tim dengan role berbeda: owner, manager, kasir, mekanik.',
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    title: 'Kartu Piutang & Hutang',
    desc: 'Pantau saldo piutang pelanggan dan hutang supplier real-time, termasuk pembayaran sebagian/cicilan dengan bukti transfer.',
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.553-.44 1.278-.659 2.003-.659.725 0 1.45.22 2.003.659l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: 'Manajemen Stok Akurat',
    desc: 'Riwayat mutasi stok lengkap (ledger), dashboard sebaran stok lintas lokasi, dan peringatan stok minimum.',
    gradient: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    title: 'Cetak Struk Thermal',
    desc: 'Cetak struk langsung ke printer thermal 58-60mm via Bluetooth — tanpa aplikasi tambahan.',
    gradient: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.32 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86 48.452 48.452 0 0 0-8.184 0 2.056 2.056 0 0 0-1.58.86 17.898 17.898 0 0 0-3.212 9.193c-.04.62.468 1.124 1.09 1.124H6.34" />
      </svg>
    ),
  },
  {
    title: 'Cetak Label Barang + QR',
    desc: 'Cetak label harga ke sticker thermal 60mm langsung dari HP — QR code (SKU, nama, harga) di samping teks, sekali cetak bisa banyak label.',
    gradient: 'from-pink-500 to-rose-400',
    bg: 'bg-pink-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
  {
    title: 'Modal & Penarikan Dana',
    desc: 'Catat suntikan modal dari pemilik/investor dan penarikan (mis. ambil keuntungan) lewat siklus faktur yang sama: draft, submit, bayar — bukan Excel terpisah.',
    gradient: 'from-indigo-500 to-violet-400',
    bg: 'bg-indigo-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-18 0h18M4.5 9v.75A2.25 2.25 0 0 0 6.75 12h10.5a2.25 2.25 0 0 0 2.25-2.25V9" />
      </svg>
    ),
  },
  {
    title: 'Kas Toko per Lokasi',
    desc: 'Laporan kas masuk/keluar riil (bukan cuma piutang/hutang) — total gabungan sekaligus rincian per cabang, tinggal klik untuk lihat riwayat transaksinya.',
    gradient: 'from-teal-500 to-emerald-400',
    bg: 'bg-teal-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125.504 1.125 1.125v.375m-18 0V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V5.625m-18 0v-.75A.75.75 0 0 1 3.75 4.5h.75m0 0h13.5m0 0v.75a.75.75 0 0 0 .75.75h.75m-15 0h15" />
      </svg>
    ),
  },
  {
    title: 'Ekosistem Bagdja',
    desc: 'Login via SSO satu akun untuk semua layanan Bagdja — tidak perlu daftar/kelola password terpisah.',
    gradient: 'from-indigo-500 to-blue-400',
    bg: 'bg-indigo-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
      </svg>
    ),
  },
];

const pricingPlans = [
  {
    name: 'FREE',
    badge: 'Aktif Sekarang',
    price: 'Rp 0',
    period: 'selamanya (selama masa beta)',
    highlight: true,
    features: [
      'Akses penuh semua fitur premium',
      'Tanpa batas transaksi',
      'Tanpa batas cabang & bisnis (selama masa beta)',
    ],
    cta: 'Mulai Gratis Sekarang',
  },
  {
    name: 'SILVER',
    badge: 'Mulai Januari 2027',
    price: 'Rp 49.000',
    period: '/ bulan',
    priceNote: 'atau Rp 490.000 / tahun',
    highlight: false,
    features: [
      '1 Bisnis + 5 Cabang/Gudang',
      '+Rp 10.000/bln per cabang tambahan (tahunan: +Rp 100.000)',
    ],
    cta: 'Daftar Gratis Dulu',
  },
  {
    name: 'GOLD',
    badge: 'Mulai Januari 2027',
    price: 'Rp 99.000',
    period: '/ bulan',
    priceNote: 'atau Rp 990.000 / tahun',
    highlight: false,
    features: [
      '3 Bisnis + 5 Cabang per Bisnis',
      '+Rp 10.000/bln per cabang tambahan (tahunan: +Rp 100.000)',
      '+Rp 35.000/bln per bisnis tambahan, maks. 5 bisnis tambahan (tahunan: +Rp 350.000)',
    ],
    cta: 'Daftar Gratis Dulu',
  },
];

const contacts = [
  {
    label: 'Telepon / WhatsApp',
    value: '+62 854-8844-8686',
    href: 'https://wa.me/6285488448686',
    cta: 'Chat via WhatsApp',
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    value: 'pos@bagdja.com',
    href: 'mailto:pos@bagdja.com',
    cta: 'Kirim Email',
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    label: 'Email Alternatif',
    value: 'bagdja.dev@gmail.com',
    href: 'mailto:bagdja.dev@gmail.com',
    cta: 'Kirim Email',
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
];

const stats = [
  { value: '5 Jenis', label: 'Faktur: Jual/Beli/Mutasi/Modal/Penarikan' },
  { value: 'Tanpa Batas', label: 'Cabang & Gudang' },
  { value: 'Per Lokasi', label: 'Laporan Kas Toko' },
  { value: '60mm', label: 'Cetak Struk & Label QR' },
];

/** Pola QR palsu buat mockup visual di landing page — sengaja bukan QR asli, cuma buat kesan visual "ini QR code" di preview. */
const QR_MOCK_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* ─── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:pb-32 sm:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-purple-50" />
          <div className="animate-pulse-glow absolute -left-32 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-violet-400/20 to-purple-300/20 blur-3xl" />
          <div className="animate-pulse-glow absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-300/20 blur-3xl" style={{ animationDelay: '2s' }} />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-200/10 to-orange-200/10 blur-3xl" />
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-float absolute left-[10%] top-[20%] h-16 w-16 rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-100/40 to-violet-50/40 backdrop-blur-sm" />
          <div className="animate-float-slow absolute right-[15%] top-[30%] h-12 w-12 rounded-full border border-blue-200/50 bg-gradient-to-br from-blue-100/40 to-blue-50/40 backdrop-blur-sm" style={{ animationDelay: '1s' }} />
          <div className="animate-float absolute bottom-[25%] left-[20%] h-10 w-10 rounded-xl border border-cyan-200/50 bg-gradient-to-br from-cyan-100/40 to-cyan-50/40 backdrop-blur-sm" style={{ animationDelay: '3s' }} />
          <div className="animate-float-slow absolute bottom-[30%] right-[10%] h-14 w-14 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-100/40 to-amber-50/40 backdrop-blur-sm" style={{ animationDelay: '2s' }} />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            <span className="text-sm font-medium text-violet-700">Solusi POS Multi-Tenant untuk Bisnis Anda</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Kasir & Stok
            <br />
            <span className="animate-gradient bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Beres Sekali Klik
            </span>
            <br />
            untuk Bisnis Anda
          </h1>

          <p className="mt-5 text-lg font-semibold italic text-violet-600 sm:text-xl">
            &ldquo;Tumbuh Kembang Dengan Bagdja&rdquo;
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            Ganti buku bon manual dengan sistem kasir digital. Kelola faktur jual-beli, mutasi stok
            antar cabang, dan kartu piutang-hutang dalam satu aplikasi — dirancang untuk bengkel
            dan toko retail.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              as={Link}
              href="/auth/login"
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-purple-500 px-8 text-base font-semibold text-white shadow-xl shadow-violet-500/30 transition-all hover:shadow-2xl hover:shadow-violet-500/40 sm:w-auto"
            >
              Mulai Kelola Bisnis Anda
            </Button>
            <Button
              as={Link}
              href="#how-it-works"
              variant="bordered"
              size="lg"
              className="w-full border-gray-300 text-base font-medium text-gray-700 sm:w-auto"
            >
              <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.555 7.168A1 1 0 0 0 8 8v4a1 1 0 0 0 1.555.832l3-2a1 1 0 0 0 0-1.664l-3-2Z" clipRule="evenodd" />
              </svg>
              Lihat Cara Kerja
            </Button>
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Dipakai untuk dogfooding langsung di bengkel bermotor sebelum dirilis ke tenant lain
          </p>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────── */}
      <section id="stats" className="relative border-y border-gray-100 bg-gray-50/50 px-4 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl px-2">
                {s.value}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
              Fitur Lengkap
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Semua yang Bisnis Anda
              <br />
              <span className="text-gray-400">Butuhkan</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              Dari kasir harian sampai laporan piutang-hutang, semua dalam satu platform.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="feature-card group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className={`mb-4 inline-flex rounded-xl ${f.bg} p-3`}>
                  <div className={`bg-gradient-to-br ${f.gradient} bg-clip-text text-transparent`}>
                    {f.icon}
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Showcase (preview visual fitur unggulan) ────── */}
      <section className="scroll-mt-20 bg-gradient-to-b from-white to-gray-50 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-700">
              Lihat Langsung
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Bukan Cuma Daftar Fitur
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              Dua tampilan yang paling sering dipuji tenant yang sudah pakai — coba lihat sendiri.
            </p>
          </div>

          {/* Faktur Barang & Jasa */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                Faktur Barang & Jasa
              </span>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Satu nota, campur barang dan jasa sekaligus
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Faktur di Bagdja bukan cuma buat mencatat barang — biaya jasa/servis bisa
                ditambahkan di baris yang sama seperti sparepart, lengkap dengan harganya
                sendiri. Cocok untuk bengkel atau toko yang menjual barang sekaligus jasa
                dalam satu transaksi ke pelanggan.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  'Baris barang otomatis memotong stok, baris jasa tidak',
                  'Harga jasa bisa disesuaikan langsung per faktur',
                  'Cukup satu barang ATAU satu jasa untuk faktur tetap sah — bebas kombinasi',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <div className="w-80 rounded-lg border border-gray-200 bg-white p-5 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Faktur Jual #JUAL-0231</p>
                <div className="mt-3 space-y-2">
                  {[
                    { kind: 'BARANG', label: 'Oli Mesin 1L', price: 'Rp 45.000' },
                    { kind: 'JASA', label: 'Ganti Oli & Servis', price: 'Rp 50.000' },
                    { kind: 'BARANG', label: 'Filter Oli', price: 'Rp 25.000' },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${row.kind === 'BARANG' ? 'bg-amber-50' : 'bg-blue-50'}`}
                    >
                      <div>
                        <span
                          className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${row.kind === 'BARANG' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}
                        >
                          {row.kind}
                        </span>
                        <span className="text-xs font-medium text-gray-800">{row.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{row.price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-3">
                  <span className="text-xs font-bold text-gray-500">Total</span>
                  <span className="text-base font-extrabold text-gray-900">Rp 120.000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cetak Label + QR */}
          <div className="mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="mb-3 inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-700">
                Cetak Label Barang
              </span>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Label harga + QR, langsung dari HP ke sticker printer
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Klik "Cetak Label" di halaman Produk, tentukan jumlah label yang mau dicetak, dan
                kirim langsung ke printer thermal 60mm via Bluetooth — tanpa install aplikasi
                tambahan, tanpa kabel. QR code di kiri label menyimpan SKU, nama, dan harga; teksnya
                sengaja dicetak besar di kanan supaya tetap gampang dibaca mata tanpa alat scan.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  'Cetak banyak label sekaligus dalam satu sesi koneksi printer',
                  'QR berisi SKU, nama produk, dan harga jual terkini',
                  'Layout QR + teks digambar sebagai satu bitmap — rapi di printer generik apa pun',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <div className="rounded-3xl bg-gradient-to-br from-pink-100 via-rose-50 to-white p-8 shadow-inner">
                <div className="w-72 rounded-lg border border-dashed border-gray-300 bg-white p-4 shadow-md">
                  <div className="flex gap-4">
                    <div className="grid h-24 w-24 shrink-0 grid-cols-11 gap-[1px] bg-white p-1 ring-1 ring-gray-200">
                      {QR_MOCK_PATTERN.flat().map((cell, i) => (
                        <div key={i} className={cell ? 'bg-gray-900' : 'bg-white'} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-tight text-gray-900">BUSI NGK CPR8EA-9</p>
                      <p className="mt-1 text-[11px] text-gray-500">SKU: BUSINGK001</p>
                      <p className="mt-2 text-lg font-extrabold text-gray-900">Rp 45.000</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-medium text-gray-400">Preview label 60mm — bukan ukuran asli</p>
              </div>
            </div>
          </div>

          {/* Kas Toko per Lokasi */}
          <div className="mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="flex justify-center lg:order-2">
              <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kas Toko</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <p className="text-[10px] font-medium text-emerald-700">Kas Masuk</p>
                    <p className="text-sm font-bold text-emerald-700">23jt</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2 text-center">
                    <p className="text-[10px] font-medium text-rose-700">Kas Keluar</p>
                    <p className="text-sm font-bold text-rose-700">18jt</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-2 text-center">
                    <p className="text-[10px] font-medium text-violet-700">Selisih</p>
                    <p className="text-sm font-bold text-violet-700">+5jt</p>
                  </div>
                </div>
                <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-gray-400">Per Lokasi</p>
                <div className="space-y-2">
                  {[
                    { name: 'Toko Pusat', in: '15jt', out: '10jt' },
                    { name: 'Cabang Selatan', in: '8jt', out: '8jt' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <span className="font-medium text-gray-700">{row.name}</span>
                      <span className="text-emerald-600">+{row.in}</span>
                      <span className="text-rose-500">-{row.out}</span>
                      <span className="font-semibold text-violet-600">Detail →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:order-1">
              <span className="mb-3 inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                Kas Toko per Lokasi
              </span>
              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Tahu persis uang masuk-keluar di tiap cabang
              </h3>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                Bukan cuma piutang-hutang — laporan Kas Toko menghitung kas yang benar-benar
                bergerak dari pembayaran nyata (termasuk modal masuk & penarikan), digabung jadi
                satu angka bisnis, sekaligus dipecah per lokasi. Klik salah satu cabang untuk lihat
                riwayat lengkap transaksi yang membentuk angkanya.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  'Filter rentang tanggal, dari harian sampai bulanan',
                  'Rincian per cabang/gudang, bukan cuma total gabungan',
                  'Drill-down ke histori faktur yang membentuk angka kas',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Roadmap ────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 px-6 py-12 text-center sm:px-12 sm:py-16">
          <span className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 shadow-sm">
            Terus Berkembang
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Fitur di atas cuma permulaan
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Bagdja POS akan terus kami kembangkan berdasarkan kebutuhan nyata tenant yang sudah
            pakai. Setelah bengkel dan toko retail, langkah berikutnya adalah merambah ke jenis
            bisnis lain — dengan filosofi yang sama: alur kerja yang simpel, dan platform yang
            tumbuh bersama bisnis Anda.
          </p>

          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl bg-white/70 p-4 text-left shadow-sm">
            <div className="mt-0.5 flex-shrink-0 rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Transaksi Lancar, Bahkan Tanpa Internet{' '}
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Segera Hadir
                </span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Jangan biarkan koneksi internet yang buruk menghentikan bisnis Anda. Cukup buka
                aplikasinya, Anda tetap bisa mencatat transaksi di lapangan dan data akan otomatis
                tersinkronisasi saat sinyal kembali pulih.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it Works ───────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 bg-gradient-to-b from-gray-50 to-white px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Mudah Sekali
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              3 Langkah Mudah
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Daftar Bisnis',
                desc: 'Login dengan akun Bagdja, langsung buat bisnis Anda — tanpa perlu setup organisasi dulu.',
                color: 'from-violet-600 to-purple-500',
                bg: 'bg-violet-50',
              },
              {
                step: '02',
                title: 'Atur Lokasi & Katalog',
                desc: 'Tambah cabang/gudang, input produk & jasa, lalu undang staff dengan role masing-masing.',
                color: 'from-blue-600 to-cyan-500',
                bg: 'bg-blue-50',
              },
              {
                step: '03',
                title: 'Mulai Transaksi',
                desc: 'Catat faktur jual/beli/mutasi, kelola pembayaran, dan cetak struk langsung ke printer thermal.',
                color: 'from-emerald-600 to-teal-500',
                bg: 'bg-emerald-50',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="absolute left-[calc(50%+40px)] top-10 hidden h-0.5 w-[calc(100%-80px)] bg-gradient-to-r from-gray-200 to-gray-100 sm:block" />
                )}
                <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ${item.bg}`}>
                  <span className={`bg-gradient-to-br ${item.color} bg-clip-text text-3xl font-extrabold text-transparent`}>
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 bg-gradient-to-b from-white to-gray-50 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
              Harga
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Harga Transparan, Tanpa Biaya Tersembunyi
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Nikmati seluruh fitur premium Bagdja POS secara <strong className="text-gray-700">GRATIS</strong>{' '}
              selama masa pengembangan hingga Desember 2026.
            </p>
          </div>

          <div className="mb-12 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
              🎉 Masa Beta: Gratis 100%
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-violet-500 bg-white shadow-xl shadow-violet-500/10 ring-1 ring-violet-500'
                    : 'border-gray-100 bg-white shadow-sm'
                }`}
              >
                <span
                  className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                    plan.highlight ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {plan.badge}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm font-medium text-gray-500">{plan.period}</span>}
                </div>
                {plan.priceNote && <p className="mt-1 text-xs text-gray-400">{plan.priceNote}</p>}

                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${plan.highlight ? 'text-violet-500' : 'text-gray-400'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  as={Link}
                  href="/auth/login"
                  fullWidth
                  className={`mt-8 font-semibold ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg shadow-violet-500/25'
                      : 'border border-gray-300 bg-white text-gray-700'
                  }`}
                  variant={plan.highlight ? 'solid' : 'bordered'}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-gray-400">
            *Harga paket berbayar berlaku setelah masa beta berakhir dan payment gateway resmi aktif. Angka di
            atas adalah rencana harga dan dapat berubah sebelum diluncurkan.
          </p>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:py-28">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-blue-600 px-6 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-violet-400/20 blur-xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Siap Rapikan Kasir
              <br />
              Bisnis Anda?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-violet-100">
              Dari bengkel motor sampai toko retail — kelola stok, kasir, dan piutang-hutang tanpa
              buku bon manual lagi.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                as={Link}
                href="/auth/login"
                size="lg"
                className="w-full bg-white px-8 text-base font-bold text-violet-600 shadow-xl transition-all hover:bg-gray-50 sm:w-auto"
              >
                Masuk & Mulai Sekarang
              </Button>
              <Button
                as={Link}
                href="#features"
                variant="bordered"
                size="lg"
                className="w-full border-white/30 text-base font-medium text-white hover:bg-white/10 sm:w-auto"
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Kontak ─────────────────────────────────────── */}
      <section id="contact" className="scroll-mt-20 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
              Kontak
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Ada Pertanyaan? Hubungi Kami
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              Via WhatsApp untuk respon cepat, atau email untuk pertanyaan yang lebih detail.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <a
                key={c.value}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="feature-card group rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              >
                <div className={`mx-auto mb-4 inline-flex rounded-xl ${c.bg} p-3`}>
                  <div className={`bg-gradient-to-br ${c.gradient} bg-clip-text text-transparent`}>{c.icon}</div>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</p>
                <p className="mt-1 text-lg font-bold text-gray-900">{c.value}</p>
                <p className="mt-3 text-sm font-semibold text-violet-600">{c.cta} →</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-500">
                <span className="text-sm font-bold text-white">B</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Bagdja POS</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <Link href="#" className="transition-colors hover:text-gray-900">Kebijakan Privasi</Link>
              <Link href="#" className="transition-colors hover:text-gray-900">Syarat & Ketentuan</Link>
              <Link href="#contact" className="transition-colors hover:text-gray-900">Kontak</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Bagdja Platform. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
