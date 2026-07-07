'use client';

import type { InvestigateResponse } from '@/types';
import RiskGauge from '@/components/RiskGauge';
import CitationChip from '@/components/agent-trace/CitationChip';
import { fmtMoney } from '@/lib/format';

const priorityStyles: Record<string, string> = {
  low: 'bg-risk-info-subtle',
  medium: 'bg-risk-medium-subtle',
  high: 'bg-risk-high-subtle',
  critical: 'bg-risk-critical-subtle',
};

export default function OverviewTab({ investigation }: { investigation: InvestigateResponse }) {
  const { alert, case: caseReport, explanation } = investigation;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
      {/* Risk + plain-English summary */}
      <div className="grid grid-cols-[220px_1fr] gap-12 items-start">
        <div className="flex justify-center pt-2">
          <RiskGauge score={alert.risk_score} band={alert.risk_band} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${priorityStyles[alert.priority] || priorityStyles.medium}`}>
              {alert.priority} priority
            </span>
            <span className="text-xs text-[var(--text-muted)] capitalize">{caseReport.pattern_type.replace('_', ' ')} pattern</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">Why this account was flagged</p>
            <p className="text-[18px] leading-relaxed text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>
              {explanation.explanation_text}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {explanation.citations.map((c, i) => (
              <CitationChip key={i} type={c.type} value={c.value} />
            ))}
          </div>
        </div>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Total flagged amount</p>
          <p className="tabular-lg text-2xl mt-1.5 text-[var(--text-primary)]">{fmtMoney(caseReport.total_amount)}</p>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Accounts involved</p>
          <p className="tabular-lg text-2xl mt-1.5 text-[var(--text-primary)]">{caseReport.parties.length}</p>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Recommended action</p>
          <p className="text-2xl mt-1.5 font-semibold capitalize" style={{ color: 'var(--brand-primary)' }}>{alert.recommended_action}</p>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">Investigation narrative</p>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-7">
          <p className="text-[15px] leading-[1.85] text-[var(--text-primary)] whitespace-pre-line" style={{ fontFamily: 'var(--font-serif)' }}>
            {caseReport.narrative}
          </p>
        </div>
      </div>

      {/* Parties */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">Parties involved</p>
        <div className="flex flex-wrap gap-2">
          {caseReport.parties.map((p, i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3.5 py-2.5 text-sm">
              <span className="font-mono font-semibold text-[var(--text-primary)]">{p.account_id}</span>
              <span className="text-[var(--text-muted)] mx-1.5">·</span>
              <span className="text-[var(--text-secondary)] capitalize">{p.role}</span>
              <span className="text-[var(--text-muted)] mx-1.5">·</span>
              <span className="tabular text-[var(--text-secondary)]">{fmtMoney(p.total_amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {alert.risk_score < 60 && (
        <div className="p-4 rounded-md border-l-4 flex items-start gap-2.5" style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderLeftColor: 'var(--risk-medium)' }}>
          <span className="text-lg">⚠</span>
          <p className="text-sm text-[var(--risk-medium)]">This case scored below our confidence threshold. Review the evidence yourself before closing it.</p>
        </div>
      )}
    </div>
  );
}
