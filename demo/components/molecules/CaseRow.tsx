/**
 * CaseRow — one row in the Investigation Queue.
 *
 * UX decision: the row answers "what should I investigate first?" at a
 * glance. Information hierarchy left-to-right:
 *   risk dot → account ID → pattern → context → band → score → chevron
 * The entire row is clickable (accessibility: keyboard focus + Enter).
 */
'use client';

import Link from 'next/link';
import RiskDot from '@/components/atoms/RiskDot';
import Badge from '@/components/atoms/Badge';
import type { PatternType, RiskBand } from '@/types';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface CaseRowProps {
  id: string;
  pattern: PatternType;
  patternLabel: string;
  riskScore: number;
  riskBand: RiskBand;
  riskLevel: RiskLevel;
  description: string;
  accountsInPattern: number;
}

function patternToLevel(score: number): RiskLevel {
  if (score >= 85) return 'critical';
  if (score >= 66) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

export default function CaseRow({
  id,
  patternLabel,
  riskScore,
  riskBand,
  description,
  accountsInPattern,
}: CaseRowProps) {
  const level = patternToLevel(riskScore);
  return (
    <Link
      href={`/app/cases/${id}`}
      className="block bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-5 py-4 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow)] transition-all duration-[var(--transition)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
    >
      <div className="flex items-center gap-4">
        <RiskDot level={level} />
        <div className="font-mono font-semibold text-[14px] text-[var(--ink-primary)] w-[88px] flex-shrink-0">
          {id}
        </div>
        <div className="text-[13px] text-[var(--ink-secondary)] w-[120px] flex-shrink-0">
          {patternLabel}
        </div>
        <div className="text-[12px] text-[var(--ink-muted)] flex-1 truncate">
          {description}
        </div>
        <Badge color={riskBand} size="sm" className="w-[72px] justify-center">
          {riskBand}
        </Badge>
        <div className="tabular-lg text-[18px] text-[var(--ink-primary)] w-[64px] text-right">
          {riskScore}
          <span className="text-xs text-[var(--ink-muted)] font-normal">/100</span>
        </div>
        <svg className="text-[var(--ink-muted)] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}
