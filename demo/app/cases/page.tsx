'use client';

import Link from 'next/link';

// Stub case list — matches the demo scenario's circular pattern (A→B→C→D→A)
const CASES = [
  { id: 'A', pattern: 'Circular', risk: 85, band: 'high', updated: '2 min ago' },
  { id: 'B', pattern: 'Circular', risk: 72, band: 'high', updated: '2 min ago' },
  { id: 'C', pattern: 'Circular', risk: 68, band: 'medium', updated: '2 min ago' },
  { id: 'D', pattern: 'Circular', risk: 91, band: 'high', updated: '2 min ago' },
];

const bandStyle: Record<string, string> = {
  high: 'bg-risk-high-subtle',
  medium: 'bg-risk-medium-subtle',
  low: 'bg-risk-low-subtle',
};

const bandTextColor: Record<string, string> = {
  high: 'risk-high',
  medium: 'risk-medium',
  low: 'risk-low',
};

export default function CasesPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-1">Cases</h1>
        <p className="text-sm text-[var(--text-muted)]">Open a case to review the evidence, the money trail, and the full record.</p>
      </div>
      <div className="space-y-3">
        {CASES.map((c) => (
          <Link
            key={c.id}
            href={`/cases/${c.id}`}
            className="block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-5 py-4 hover:border-[var(--border-strong)] transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">Account {c.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bandStyle[c.band]} ${bandTextColor[c.band]}`}>{c.band}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{c.pattern} transfer pattern</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`tabular text-lg font-bold ${bandTextColor[c.band]}`}>{c.risk}<span className="text-xs opacity-50 text-[var(--text-muted)]">/100</span></p>
                <p className="text-[11px] text-[var(--text-muted)]">{c.updated}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
