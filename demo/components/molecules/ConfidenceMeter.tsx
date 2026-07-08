/**
 * ConfidenceMeter — visual AI confidence indicator.
 *
 * UX decision: AI confidence is shown but not dramatized. A thin bar,
 * a percentage, no animation. The investigator sees the number,
 * decides whether to trust it, and moves on.
 */
'use client';

interface ConfidenceMeterProps {
  confidence: number; // 0.0 - 1.0
  showLabel?: boolean;
}

function colorForConfidence(c: number): string {
  if (c >= 0.8) return 'var(--risk-low)';
  if (c >= 0.6) return 'var(--risk-medium)';
  return 'var(--risk-high)';
}

export default function ConfidenceMeter({ confidence, showLabel = true }: ConfidenceMeterProps) {
  const pct = Math.round(confidence * 100);
  const color = colorForConfidence(confidence);
  return (
    <div className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
      {showLabel && <span>AI confidence</span>}
      <div className="w-[80px] h-[4px] bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="tabular font-semibold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}
