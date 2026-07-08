/**
 * Citation — inline evidence chip linking an AI claim to its source.
 *
 * UX decision (audit decision #4): every factual claim in the AI
 * explanation has a citation. Solves pain point #3 (explainability gap).
 * The chip is small, inline, optional to click. Clicking opens the
 * evidence in the audit pane.
 */
'use client';

import { type CitationType } from '@/types';

interface CitationProps {
  type: CitationType;
  value: string;
  onClick?: () => void;
}

const typeColor: Record<CitationType, string> = {
  pattern: 'var(--brand-orange)',
  anomaly: 'var(--risk-medium)',
  score: 'var(--risk-info)',
  transaction: 'var(--brand-blue)',
};

const typeLabel: Record<CitationType, string> = {
  pattern: 'Pattern',
  anomaly: 'Anomaly',
  score: 'Score',
  transaction: 'Transaction',
};

export default function Citation({ type, value, onClick }: CitationProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] border border-[var(--border)] text-[11px] font-mono text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)] transition-colors duration-[var(--transition)]"
      title={`${typeLabel[type]}: ${value}`}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: typeColor[type] }}
      />
      <span className="truncate max-w-[280px]">{value}</span>
    </button>
  );
}
