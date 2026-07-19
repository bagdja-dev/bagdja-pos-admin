'use client';

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Chip,
} from '@heroui/react';
import { useBusinessContext } from '../context/business-context';
import { useAuth } from '../hooks/use-auth';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuth();
  const { memberships, activeMembership, switchBusiness } = useBusinessContext();

  const displayName = user?.username ?? user?.email ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const businessItems = memberships.map((m) => ({
    key: m.business.id,
    name: m.business.name,
    role: m.role,
    isActive: activeMembership?.business.id === m.business.id,
  }));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-default-200 bg-background/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <button onClick={onMenuToggle} className="shrink-0 rounded-lg p-2 hover:bg-default-100 lg:hidden" aria-label="Toggle menu">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {activeMembership && (
          <Chip
            variant="flat"
            color="primary"
            size="sm"
            className="min-w-0"
            classNames={{ content: 'truncate' }}
          >
            {activeMembership.business.name}
          </Chip>
        )}
      </div>

      <Dropdown
        placement="bottom-end"
        classNames={{
          content: 'min-w-[16rem] rounded-xl border border-default-200 bg-white p-1 shadow-xl shadow-black/10',
        }}
      >
        <DropdownTrigger>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-default-100">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{displayName}</p>
              {activeMembership && (
                <p className="text-xs text-default-400">{activeMembership.role}</p>
              )}
            </div>
            <Avatar name={initials} size="sm" className="h-8 w-8 text-xs" color="primary" />
          </button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Profile menu"
          className="w-64 bg-white"
          itemClasses={{
            base: 'rounded-lg data-[hover=true]:bg-default-100',
            title: 'text-foreground',
            description: 'text-default-500',
          }}
          classNames={{ base: 'bg-white', list: 'bg-white' }}
          onAction={(key) => {
            const keyStr = String(key);
            if (keyStr === 'logout' || keyStr === 'new-business') return;
            const isBusiness = businessItems.some((b) => b.key === keyStr);
            if (isBusiness) switchBusiness(keyStr);
          }}
        >
          <DropdownSection
            title="Akun"
            showDivider
            classNames={{
              base: 'bg-white',
              heading: 'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-default-500',
              group: 'bg-white',
              divider: 'bg-default-200',
            }}
          >
            <DropdownItem key="profile" isReadOnly className="cursor-default bg-default-50 opacity-100" textValue={displayName}>
              <div className="py-0.5">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                {user?.email && <p className="text-xs text-default-500">{user.email}</p>}
              </div>
            </DropdownItem>
          </DropdownSection>

          <DropdownSection
            title="Bisnis"
            showDivider
            classNames={{
              base: 'bg-white',
              heading: 'px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-default-500',
              group: 'bg-white',
              divider: 'bg-default-200',
            }}
          >
            {businessItems.map((b) => (
              <DropdownItem
                key={b.key}
                textValue={b.name}
                endContent={
                  b.isActive ? (
                    <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : undefined
                }
              >
                <div>
                  <p className="text-sm">{b.name}</p>
                  <p className="text-xs text-default-400">{b.role}</p>
                </div>
              </DropdownItem>
            ))}
          </DropdownSection>

          <DropdownSection showDivider classNames={{ base: 'bg-white', group: 'bg-white', divider: 'bg-default-200' }}>
            <DropdownItem key="new-business" href="/dashboard/businesses/new" textValue="Buat bisnis baru">
              + Buat bisnis baru
            </DropdownItem>
          </DropdownSection>

          <DropdownSection classNames={{ base: 'bg-white', group: 'bg-white' }}>
            <DropdownItem key="logout" color="danger" href="/auth/logout" textValue="Keluar" className="text-danger">
              Keluar
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    </header>
  );
}
