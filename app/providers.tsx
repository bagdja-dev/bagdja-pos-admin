'use client';

import { HeroUIProvider } from '@heroui/react';
import type { ReactNode } from 'react';

import { GlobalErrorModal } from './components/global-error-modal';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <div id="modal-root" />
      <GlobalErrorModal />
    </HeroUIProvider>
  );
}
