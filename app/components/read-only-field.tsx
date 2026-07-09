export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-default-200 bg-default-100 px-4 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}
