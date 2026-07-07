'use client';

import type { InvestigateResponse } from '@/types';
import AgentTrace from '@/components/agent-trace/AgentTrace';
import AuditTrail from '@/components/AuditTrail';
import JsonViewer from '@/components/agent-trace/JsonViewer';

/**
 * Everything a developer, auditor, or regulator might need — and nothing
 * an investigator needs on a normal day. Kept off the Overview entirely
 * so the main workspace stays calm; this tab is where it all surfaces.
 */
export default function AuditTab({ investigation }: { investigation: InvestigateResponse }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div className="mb-2">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Auditor &amp; developer room</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Full agent reasoning, system activity, and raw payloads — for compliance review or troubleshooting, not day-to-day investigation.</p>
      </div>
      <AgentTrace investigation={investigation} />
      <AuditTrail investigation={investigation} />
      <JsonViewer data={investigation} label="RAW INVESTIGATION RESPONSE" maxHeight="420px" />
    </div>
  );
}
