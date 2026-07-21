'use client';

import { LayoutGrid, MonitorSmartphone, Table2 } from 'lucide-react';
import type { ViewMode } from '../hooks/use-view-mode';

const OPTIONS: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'card', label: 'Kartu', icon: LayoutGrid },
  { value: 'table', label: 'Tabel', icon: Table2 },
  { value: 'auto', label: 'Otomatis', icon: MonitorSmartphone },
];

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-default-200 bg-default-50 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={mode === value}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            mode === value
              ? 'bg-white text-primary shadow-sm'
              : 'text-default-500 hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
