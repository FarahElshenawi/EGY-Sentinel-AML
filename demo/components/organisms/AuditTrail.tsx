/**
 * AuditTrail — chronological log of every action on a case.
 *
 * UX decision: audit trail is for compliance officers and regulators,
 * not the investigator's primary flow. Lives in the audit pane of the
 * workspace, not the overview.
 */
'use client';

import { fmtAudit } from '@/lib/format';

export interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  detail?: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
}

export default function AuditTrail({ entries }: AuditTrailProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--ink-muted)] text-sm">
        No audit activity yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3"
        >
          <div className="flex items-baseline gap-3">
            <span className="tabular text-[11px] text-[var(--ink-muted)] flex-shrink-0">
              {fmtAudit(entry.timestamp)}
            </span>
            <span className="font-semibold text-[13px] text-[var(--ink-primary)]">
              {entry.actor}
            </span>
            <span className="text-[13px] text-[var(--ink-secondary)]">
              {entry.action}
            </span>
          </div>
          {entry.detail && (
            <p className="text-[12px] text-[var(--ink-muted)] mt-1.5 pl-[120px]">
              {entry.detail}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
