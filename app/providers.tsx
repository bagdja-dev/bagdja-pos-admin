'use client';

import { HeroUIProvider } from '@heroui/react';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <div id="modal-root" />
    </HeroUIProvider>
  );
}
