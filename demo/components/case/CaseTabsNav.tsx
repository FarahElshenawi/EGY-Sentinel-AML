'use client';

export type CaseTabId = 'overview' | 'network' | 'audit';

interface Tab { id: CaseTabId; label: string; }

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'network', label: 'Network Graph' },
  { id: 'audit', label: 'Audit Log & Raw Data' },
];

interface CaseTabsNavProps {
  active: CaseTabId;
  onChange: (id: CaseTabId) => void;
}

/**
 * Progressive disclosure lives here: only "Overview" is shown by default.
 * The graph gets its own uncluttered tab, and every raw payload / system
 * log is pushed into "Audit Log & Raw Data" — out of an investigator's way.
 */
export default function CaseTabsNav({ active, onChange }: CaseTabsNavProps) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-3.5 text-sm font-medium transition-colors ${
            active === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--brand-primary)]" />
          )}
        </button>
      ))}
    </div>
  );
}
