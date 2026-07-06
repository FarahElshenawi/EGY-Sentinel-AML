'use client';

interface CitationChipProps { type: 'pattern' | 'anomaly' | 'score' | 'transaction'; value: string; onClick?: () => void; }
const citationConfig = {
  pattern: { icon: '🔍', label: 'PATTERN', color: 'var(--risk-info)' },
  anomaly: { icon: '⚠', label: 'ANOMALY', color: 'var(--risk-medium)' },
  score: { icon: '📊', label: 'SCORE', color: 'var(--brand-primary)' },
  transaction: { icon: '💸', label: 'TXN', color: 'var(--risk-high)' },
};

export default function CitationChip({ type, value, onClick }: CitationChipProps) {
  const config = citationConfig[type] || citationConfig.pattern;
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-all hover:scale-105" style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} title={`Click to view evidence: ${value}`}>
      <span>{config.icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
      <span className="text-[var(--text-secondary)]">{value}</span>
    </button>
  );
}
