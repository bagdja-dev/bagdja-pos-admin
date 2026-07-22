export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-default-200 bg-default-100 px-2.5 py-2 sm:px-4 sm:py-2.5">
      <p className="text-[8px] font-bold uppercase tracking-wide text-default-500 sm:text-[10px] sm:tracking-wider">
        {label}
      </p>
      <p className="text-xs text-foreground sm:text-sm">{value || '—'}</p>
    </div>
  );
}
