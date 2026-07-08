/**
 * AgentTrace — visualizes the 3-agent AI pipeline: Alert → Case → Explanation.
 *
 * UX decision: shows the investigator the AI's reasoning chain so they
 * can verify it. Each agent card shows its role, input, output, and
 * the time it took. Solves audit pain point #3 (explainability gap).
 */
'use client';

import type { InvestigateResponse } from '@/types';
import { fmtConfidence } from '@/lib/format';
import Badge from '@/components/atoms/Badge';

interface AgentTraceProps {
  investigation: InvestigateResponse;
}

interface AgentCardProps {
  step: number;
  name: string;
  role: string;
  status: 'success' | 'fallback';
  children: React.ReactNode;
}

function AgentCard({ step, name, role, status, children }: AgentCardProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--brand-navy-subtle)] text-[var(--brand-navy)] text-xs font-bold tabular">
          {step}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--ink-primary)]">{name}</span>
            {status === 'fallback' && <Badge color="muted" size="xs">fallback</Badge>}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)]">{role}</p>
        </div>
      </div>
      <div className="text-[12px] text-[var(--ink-secondary)] space-y-1.5 pl-8">
        {children}
      </div>
    </div>
  );
}

export default function AgentTrace({ investigation }: AgentTraceProps) {
  const { alert, case: caseReport, explanation } = investigation;
  const caseFallback = '_fallback' in caseReport && caseReport._fallback === true;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-1">
          Agent reasoning chain
        </h4>
        <p className="text-[12px] text-[var(--ink-secondary)] mb-3">
          The AI pipeline that produced this case. Every step is logged for audit.
        </p>
      </div>

      <AgentCard step={1} name="Alert Agent" role="Classifies priority and recommends action" status="success">
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Priority:</span>
          <Badge color={alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'high' : 'medium'} size="xs">
            {alert.priority}
          </Badge>
        </div>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Action:</span>
          <span className="capitalize">{alert.recommended_action}</span>
        </div>
        <p className="text-[var(--ink-muted)] italic mt-1">"{alert.summary}"</p>
      </AgentCard>

      <AgentCard step={2} name="Case Builder" role="Assembles timeline, parties, and SAR narrative" status={caseFallback ? 'fallback' : 'success'}>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Case ID:</span>
          <span className="font-mono">{caseReport.case_id}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Timeline events:</span>
          <span className="tabular">{caseReport.timeline.length}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Parties:</span>
          <span className="tabular">{caseReport.parties.length}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Total amount:</span>
          <span className="tabular">${caseReport.total_amount.toLocaleString()}</span>
        </div>
      </AgentCard>

      <AgentCard step={3} name="Explanation Agent" role="Plain-English summary with citations" status="success">
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Confidence:</span>
          <span className="tabular font-semibold">{fmtConfidence(explanation.confidence)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-[var(--ink-muted)]">Citations:</span>
          <span className="tabular">{explanation.citations.length}</span>
        </div>
      </AgentCard>
    </div>
  );
}
