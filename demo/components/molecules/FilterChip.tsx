/**
 * FilterChip — toggleable filter pill with count.
 *
 * UX decision: filters persist in the URL where possible. The count
 * tells the investigator how many items match before they click.
 */
'use client';

interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

export default function FilterChip({ label, count, active = false, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius)] text-[12px] font-medium border transition-colors duration-[var(--transition)] ${
        active
          ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
          : 'bg-[var(--bg-surface)] text-[var(--ink-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink-primary)]'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`tabular text-[11px] ${active ? 'opacity-70' : 'text-[var(--ink-muted)]'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
