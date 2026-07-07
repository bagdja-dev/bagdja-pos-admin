'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Membership, MeResponse, PosRole } from '../lib/types';

interface BusinessContextValue {
  memberships: Membership[];
  activeMembership: Membership | null;
  businessId: string | null;
  role: PosRole | null;
  locationId: string | null;
  loading: boolean;
  switchBusiness: (businessId: string) => void;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const STORAGE_KEY = 'pos_active_business';

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        setMemberships([]);
        setActiveMembership(null);
        return;
      }
      const data = (await res.json()) as MeResponse;
      const list = data.memberships ?? [];
      setMemberships(list);

      const savedId = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const found = list.find((m) => m.business.id === savedId);
      setActiveMembership(found ?? list[0] ?? null);
    } catch {
      setMemberships([]);
      setActiveMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const switchBusiness = useCallback(
    (businessId: string) => {
      const found = memberships.find((m) => m.business.id === businessId);
      if (found) {
        setActiveMembership(found);
        localStorage.setItem(STORAGE_KEY, businessId);
      }
    },
    [memberships],
  );

  const value = useMemo(
    () => ({
      memberships,
      activeMembership,
      businessId: activeMembership?.business.id ?? null,
      role: activeMembership?.role ?? null,
      locationId: activeMembership?.location?.id ?? null,
      loading,
      switchBusiness,
      refresh,
    }),
    [memberships, activeMembership, loading, switchBusiness, refresh],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusinessContext must be used within BusinessProvider');
  }
  return ctx;
}
