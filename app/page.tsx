import Link from 'next/link';
import { Button } from '@heroui/react';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-950 to-slate-800 px-4 text-center text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-primary">Bagdja</span> POS Admin
        </h1>
        <p className="mt-3 max-w-md text-sm text-white/70 sm:text-base">
          Kelola bisnis, lokasi, staff, katalog, dan faktur bengkel/toko Anda.
        </p>
      </div>
      <Button as={Link} href="/auth/login" color="primary" size="lg">
        Masuk dengan Bagdja Account
      </Button>
    </main>
  );
}
