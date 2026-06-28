'use client';

import type { CaseReport } from '@/types';

interface CasePanelProps {
  caseReport: CaseReport;
}

export default function CasePanel({ caseReport }: CasePanelProps) {
  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <span>📋</span> Case Report
          </h3>
          <span className="font-mono text-xs opacity-75">{caseReport.case_id}</span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Narrative */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Narrative</p>
          <p className="text-sm text-gray-800 leading-relaxed">{caseReport.narrative}</p>
        </div>

        {/* Total amount + Pattern */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="font-bold text-lg text-gray-900">{fmtMoney(caseReport.total_amount)}</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pattern</p>
            <p className="font-bold text-lg text-gray-900 capitalize">{caseReport.pattern_type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Timeline</p>
          <div className="space-y-2">
            {caseReport.timeline.map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 w-12 text-xs font-mono text-gray-500 pt-0.5">
                  step {entry.step}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{entry.event}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono">{entry.account_id}</span> · {fmtMoney(entry.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Parties Involved</p>
          <div className="flex flex-wrap gap-2">
            {caseReport.parties.map((party, i) => (
              <div key={i} className="bg-gray-100 rounded px-3 py-1.5 text-xs">
                <span className="font-mono font-semibold">{party.account_id}</span>
                <span className="text-gray-500 ml-1">· {party.role}</span>
                <span className="text-gray-700 ml-1">· {fmtMoney(party.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SAR fields */}
        <div className="border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">SAR Fields</p>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Filing reason:</span>{' '}
              <span className="text-gray-800">{caseReport.sar_fields.filing_reason}</span>
            </div>
            <div>
              <span className="text-gray-500">Activity type:</span>{' '}
              <span className="text-gray-800">{caseReport.sar_fields.suspicious_activity_type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
