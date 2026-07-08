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
    desc: 'Cetak struk langsung dari browser ke printer thermal 58-60mm via Bluetooth — tanpa aplikasi tambahan.',
    gradient: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.32 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86 48.452 48.452 0 0 0-8.184 0 2.056 2.056 0 0 0-1.58.86 17.898 17.898 0 0 0-3.212 9.193c-.04.62.468 1.124 1.09 1.124H6.34" />
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

const stats = [
  { value: '3-in-1', label: 'Faktur Jual/Beli/Mutasi' },
  { value: 'Tanpa Batas', label: 'Cabang & Gudang' },
  { value: 'Real-time', label: 'Kartu Piutang/Hutang' },
  { value: '60mm', label: 'Cetak Struk Thermal' },
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
            <span className="text-sm font-medium text-violet-700">Solusi POS Multi-Tenant untuk Retail & Bengkel</span>
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
              <Link href="#" className="transition-colors hover:text-gray-900">Kontak</Link>
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
