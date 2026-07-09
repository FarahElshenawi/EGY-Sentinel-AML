/**
 * Investigation Workspace — two-pane layout.
 * Left = reasoning (AI assessment, evidence, narrative).
 * Right = graph/audit toggle.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { InvestigateResponse, GraphResponse } from '@/types';
import { fmtMoney } from '@/lib/format';
import RiskGauge from '@/components/molecules/RiskGauge';
import ConfidenceMeter from '@/components/molecules/ConfidenceMeter';
import Citation from '@/components/atoms/Citation';
import Badge from '@/components/atoms/Badge';
import DecisionPanel from '@/components/organisms/DecisionPanel';
import AgentTrace from '@/components/organisms/AgentTrace';
import AuditTrail, { type AuditEntry } from '@/components/organisms/AuditTrail';
import GraphCanvas from '@/components/GraphCanvas';
import JsonViewer from '@/components/agent-trace/JsonViewer';
import Spinner from '@/components/atoms/Spinner';

type RightPane = 'graph' | 'audit';

export default function CaseWorkspacePage() {
  const params = useParams<{ id: string }>();
  const accountId = decodeURIComponent(params.id);

  const [investigation, setInvestigation] = useState<InvestigateResponse | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rightPane, setRightPane] = useState<RightPane>('graph');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGraphError(null);
    Promise.all([
      api.investigate(accountId),
      api.getAccountGraph(accountId).catch((err) => {
        if (!cancelled) setGraphError(err instanceof ApiError ? err.message : 'Could not load graph.');
        return null;
      }),
    ])
      .then(([investigationData, graphData]) => {
        if (cancelled) return;
        setInvestigation(investigationData);
        if (graphData) setGraphData(graphData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'This case could not be opened.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accountId]);

  const auditEntries: AuditEntry[] = investigation ? [
    { timestamp: investigation.alert.timestamp || new Date().toISOString(), actor: 'Pattern Detector', action: `Pattern detected: ${investigation.case.pattern_type}`, detail: `Score: ${investigation.alert.risk_score}/100` },
    { timestamp: investigation.alert.timestamp || new Date().toISOString(), actor: 'Alert Agent', action: `Alert generated: ${investigation.alert.priority} priority`, detail: investigation.alert.summary },
    { timestamp: investigation.case.generated_at || new Date().toISOString(), actor: 'Case Builder', action: `Case ${investigation.case.case_id} created`, detail: `${investigation.case.timeline.length} timeline events, ${investigation.case.parties.length} parties` },
    { timestamp: investigation.explanation.generated_at || new Date().toISOString(), actor: 'Explanation Agent', action: 'Explanation generated', detail: `Confidence: ${Math.round(investigation.explanation.confidence * 100)}%` },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Spinner size={32} className="mx-auto mb-3" />
          <p className="text-sm text-[var(--ink-muted)]">Opening the case file…</p>
        </div>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-6">
        <p className="text-lg font-semibold text-[var(--risk-critical)] mb-2">This case couldn&apos;t be opened</p>
        <p className="text-sm text-[var(--ink-muted)]">{error}</p>
        <Link href="/app/queue" className="inline-block mt-4 text-sm text-[var(--brand-blue)] hover:underline">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const { alert, case: caseReport, explanation } = investigation;

  return (
    <div className="flex flex-col h-screen">
      <div
        className="flex items-center gap-3 px-6 bg-[var(--bg-surface)] border-b border-[var(--border)]"
        style={{ height: 'var(--workspace-header-height)' }}
      >
        <Link href="/app/queue" className="flex items-center gap-1 text-[13px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Queue
        </Link>
        <span className="text-[var(--border-strong)]">/</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[15px] font-semibold text-[var(--ink-primary)]">{accountId}</span>
            <Badge color={alert.priority === 'critical' ? 'critical' : alert.priority === 'high' ? 'high' : 'medium'} size="sm">
              {alert.priority} priority
            </Badge>
          </div>
          <div className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            {caseReport.case_id} · {caseReport.pattern_type.replace('_', ' ')} pattern · {caseReport.parties.length} accounts
          </div>
        </div>
        <div className="ml-auto">
          <DecisionPanel caseId={caseReport.case_id} accountId={accountId} investigation={investigation} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE */}
        <div className="w-[58%] overflow-y-auto border-r border-[var(--border)] px-8 py-8">
          {/* AI Assessment */}
          <section className="mb-10">
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <RiskGauge score={alert.risk_score} band={alert.risk_band} />
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge color="orange" size="sm">{caseReport.pattern_type.replace('_', ' ')}</Badge>
                  <Badge color={alert.priority === 'critical' ? 'critical' : 'high'} size="sm">{alert.priority} priority</Badge>
                </div>
                <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-2">
                  Why this account was flagged
                </h2>
                <p className="text-[17px] leading-[1.6] text-[var(--ink-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>
                  {explanation.explanation_text}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {explanation.citations.map((c, i) => (
                    <Citation key={i} type={c.type} value={c.value} />
                  ))}
                </div>
                <div className="mt-4">
                  <ConfidenceMeter confidence={explanation.confidence} />
                </div>
              </div>
            </div>
          </section>

          {/* Primary Evidence */}
          <section className="mb-10">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Primary evidence</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Total flagged</p>
                <p className="tabular-lg text-[22px] text-[var(--ink-primary)] mt-1">{fmtMoney(caseReport.total_amount)}</p>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Accounts involved</p>
                <p className="tabular-lg text-[22px] text-[var(--ink-primary)] mt-1">{caseReport.parties.length}</p>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Recommended action</p>
                <p className="text-[18px] font-semibold mt-1 capitalize" style={{ color: 'var(--risk-critical)' }}>
                  {alert.recommended_action}
                </p>
              </div>
            </div>
          </section>

          {/* Timeline */}
          {caseReport.timeline.length > 0 && (
            <section className="mb-10">
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">
                Timeline · {caseReport.timeline.length} events
              </h3>
              <div>
                {caseReport.timeline.map((event, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_120px] gap-4 py-3 border-b border-[var(--border)] items-center text-[13px]">
                    <span className="tabular text-[12px] text-[var(--ink-muted)] font-semibold">step {event.step}</span>
                    <span className="text-[var(--ink-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>{event.event}</span>
                    <span className="tabular text-[13px] font-semibold text-[var(--ink-primary)] text-right">{fmtMoney(event.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Parties */}
          {caseReport.parties.length > 0 && (
            <section className="mb-10">
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">
                Parties involved · {caseReport.parties.length}
              </h3>
              <div className="flex flex-wrap gap-2">
                {caseReport.parties.map((party, i) => (
                  <div
                    key={i}
                    className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2 text-[13px] flex items-center gap-2 ${
                      party.role === 'subject' ? 'border-l-[3px] border-l-[var(--brand-orange)]' : ''
                    }`}
                  >
                    <span className="font-mono font-semibold text-[var(--ink-primary)]">{party.account_id}</span>
                    <span className="text-[var(--ink-muted)] text-[11px] capitalize">{party.role}</span>
                    <span className="tabular text-[12px] text-[var(--ink-secondary)]">{fmtMoney(party.total_amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Narrative */}
          <section className="mb-10">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Investigation narrative</h3>
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6">
              <p className="text-[15px] leading-[1.8] text-[var(--ink-primary)] whitespace-pre-line" style={{ fontFamily: 'var(--font-serif)' }}>
                {caseReport.narrative}
              </p>
            </div>
            {caseReport.sar_fields && (
              <div className="mt-4 bg-[var(--bg-inset)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
                <h4 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-2">SAR fields</h4>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
                  <dt className="text-[var(--ink-muted)]">Filing reason</dt>
                  <dd className="text-[var(--ink-primary)]">{caseReport.sar_fields.filing_reason}</dd>
                  <dt className="text-[var(--ink-muted)]">Activity type</dt>
                  <dd className="font-mono text-[var(--ink-primary)]">{caseReport.sar_fields.suspicious_activity_type}</dd>
                  {caseReport.sar_fields.reporting_institution && (
                    <>
                      <dt className="text-[var(--ink-muted)]">Institution</dt>
                      <dd className="text-[var(--ink-primary)]">{caseReport.sar_fields.reporting_institution}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT PANE */}
        <div className="w-[42%] flex flex-col">
          <div className="flex border-b border-[var(--border)] bg-[var(--bg-surface)]">
            <button
              onClick={() => setRightPane('graph')}
              className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                rightPane === 'graph' ? 'text-[var(--brand-navy)] border-[var(--brand-orange)]' : 'text-[var(--ink-secondary)] border-transparent hover:text-[var(--ink-primary)]'
              }`}
            >
              Network graph
            </button>
            <button
              onClick={() => setRightPane('audit')}
              className={`flex-1 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                rightPane === 'audit' ? 'text-[var(--brand-navy)] border-[var(--brand-orange)]' : 'text-[var(--ink-secondary)] border-transparent hover:text-[var(--ink-primary)]'
              }`}
            >
              Audit log
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {rightPane === 'graph' && (
              <div className="h-full bg-[var(--bg-canvas)]">
                {graphData ? (
                  <GraphCanvas
                    data={graphData}
                    onNodeClick={() => {}}
                    selectedNode={accountId}
                    patternMap={investigation ? new Map([[accountId, investigation.case.pattern_type]]) : null}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-center px-6">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--risk-critical)] mb-1">Graph unavailable</p>
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        {graphError || 'Could not load the subgraph for this account.'}
                      </p>
                      <p className="text-[10px] text-[var(--ink-muted)] mt-2">
                        Make sure the backend is restarted with the latest code.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {rightPane === 'audit' && (
              <div className="p-6 max-w-[640px]">
                <div className="mb-4">
                  <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-1">Auditor &amp; developer room</h4>
                  <p className="text-[12px] text-[var(--ink-secondary)]">
                    Full agent reasoning, system activity, and raw payloads — for compliance review or troubleshooting.
                  </p>
                </div>
                <div className="mb-6">
                  <h5 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Audit trail</h5>
                  <AuditTrail entries={auditEntries} />
                </div>
                <div className="mb-6">
                  <h5 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Agent reasoning</h5>
                  <AgentTrace investigation={investigation} />
                </div>
                <div>
                  <h5 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Raw response</h5>
                  <JsonViewer data={investigation} label="INVESTIGATION RESPONSE" maxHeight="400px" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
