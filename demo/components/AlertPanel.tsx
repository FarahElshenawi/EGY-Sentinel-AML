'use client';

import type { Alert } from '@/types';
import { fmtNumber } from '@/lib/format';

const priorityColors: Record<string, string> = {
  low: 'bg-risk-info-subtle',
  medium: 'bg-risk-medium-subtle',
  high: 'bg-risk-high-subtle',
  critical: 'bg-risk-critical-subtle',
};

export default function AlertPanel({ alert }: { alert: Alert }) {
  const priorityClass = priorityColors[alert.priority] || priorityColors.medium;
  const riskClass = alert.risk_band === 'high' ? 'risk-high' : alert.risk_band === 'medium' ? 'risk-medium' : 'risk-low';

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[var(--brand-primary)] text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm"><span>🚨</span> Alert</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${priorityClass}`}>{alert.priority}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Account</p>
          <p className="font-mono font-semibold text-[var(--text-primary)] text-sm">{alert.account_id}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Risk Score</p>
            <p className={`tabular-lg text-lg ${riskClass}`}>{fmtNumber(alert.risk_score)}<span className="text-xs opacity-60">/100</span></p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Risk Band</p>
            <p className={`text-lg font-bold capitalize ${riskClass}`}>{alert.risk_band}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Pattern</p>
          <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{alert.pattern_type.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Summary</p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{alert.summary}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Recommended Action</p>
          <p className="text-sm font-medium text-[var(--brand-primary)] capitalize">{alert.recommended_action}</p>
        </div>
      </div>
    </div>
  );
}
