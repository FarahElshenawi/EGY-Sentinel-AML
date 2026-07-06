'use client';

import type { CaseReport } from '@/types';
import { fmtMoney, fmtNumber } from '@/lib/format';

export default function CasePanel({ caseReport }: { caseReport: CaseReport }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[var(--text-primary)] text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm"><span>📋</span> Case Report</h3>
          <span className="font-mono text-xs opacity-75">{caseReport.case_id}</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Narrative</p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>{caseReport.narrative}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-subtle)] rounded p-3">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Amount</p>
            <p className="tabular-lg text-lg text-[var(--text-primary)]">{fmtMoney(caseReport.total_amount)}</p>
          </div>
          <div className="bg-[var(--bg-subtle)] rounded p-3">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Pattern</p>
            <p className="text-lg font-bold text-[var(--text-primary)] capitalize">{caseReport.pattern_type.replace('_', ' ')}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Timeline</p>
          <div className="space-y-2">
            {caseReport.timeline.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 w-14 text-xs font-mono text-[var(--text-muted)] pt-0.5 tabular">step {entry.step}</div>
                <div className="flex-1">
                  <p className="text-[var(--text-primary)]">{entry.event}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    <span className="font-mono">{entry.account_id}</span>
                    <span className="ml-1">·</span>
                    <span className="ml-1 tabular">{fmtMoney(entry.amount)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Parties Involved</p>
          <div className="flex flex-wrap gap-2">
            {caseReport.parties.map((party, i) => (
              <div key={i} className="bg-[var(--bg-subtle)] rounded px-3 py-1.5 text-xs">
                <span className="font-mono font-semibold text-[var(--text-primary)]">{party.account_id}</span>
                <span className="text-[var(--text-muted)] ml-1">· {party.role}</span>
                <span className="text-[var(--text-secondary)] ml-1">·</span>
                <span className="ml-1 tabular text-[var(--text-secondary)]">{fmtMoney(party.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-[var(--border-default)] pt-3">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">SAR Fields</p>
          <div className="space-y-1 text-sm">
            <div><span className="text-[var(--text-muted)]">Filing reason:</span> <span className="text-[var(--text-primary)]">{caseReport.sar_fields.filing_reason}</span></div>
            <div><span className="text-[var(--text-muted)]">Activity type:</span> <span className="text-[var(--text-primary)]">{caseReport.sar_fields.suspicious_activity_type}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
