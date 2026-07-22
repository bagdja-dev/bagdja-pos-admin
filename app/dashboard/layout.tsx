'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '../components/loading-spinner';
import { Sidebar } from '../components/sidebar';
import { Topbar } from '../components/topbar';
import { BusinessProvider, useBusinessContext } from '../context/business-context';
import { BusinessIntlProvider } from '../i18n/business-intl-provider';

/**
 * Redirect ke landing page kalau belum login sama sekali — penting untuk
 * TWA (`start_url: /dashboard`) yang melewati landing page dari awal, jadi
 * orang yang baru install APK tanpa akun tidak langsung nyasar ke layar
 * "Belum ada bisnis" yang membingungkan.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, unauthenticated } = useBusinessContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && unauthenticated) {
      router.replace('/');
    }
  }, [loading, unauthenticated, router]);

  if (loading || unauthenticated) return <LoadingSpinner />;
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BusinessProvider>
      <BusinessIntlProvider>
        <RequireAuth>
          {/* `h-dvh` (bukan `h-screen`/100vh) — di mobile, 100vh dihitung dari
              tinggi viewport MAKSIMAL (toolbar browser tersembunyi), jadi container
              ini jadi lebih tinggi dari area yang benar-benar terlihat saat toolbar
              muncul, memaksa seluruh halaman (termasuk header `sticky`) ikut
              ter-scroll di level body. `100dvh` mengikuti tinggi viewport yang
              benar-benar terlihat saat itu, jadi body tidak pernah perlu scroll —
              cuma `<main>` di bawah yang scroll internal, header selalu diam. */}
          <div className="flex h-dvh overflow-hidden bg-background">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
          </div>
        </RequireAuth>
      </BusinessIntlProvider>
    </BusinessProvider>
  );
}
