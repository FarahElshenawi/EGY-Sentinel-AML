'use client';

import { useState, useEffect } from 'react';
import type { InvestigateResponse } from '@/types';
import AlertPanel from './AlertPanel';
import CasePanel from './CasePanel';
import ExplanationPanel from './ExplanationPanel';
import AgentTrace from './agent-trace/AgentTrace';

interface SidePanelProps { selectedAccount: string | null; investigation: InvestigateResponse | null; loading: boolean; }

const LOADING_MESSAGES = [
  'Fetching transaction history...',
  'Resolving entity relationships...',
  'Building transaction graph...',
  'Running pattern detectors...',
  'Computing risk score...',
  'Alert Agent analyzing...',
  'Case Builder assembling report...',
  'Explanation Agent generating...',
];

export default function SidePanel({ selectedAccount, investigation, loading }: SidePanelProps) {
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  useEffect(() => {
    if (!loading) { setLoadingMsgIndex(0); return; }
    const timer = setInterval(() => { setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length); }, 800);
    return () => clearInterval(timer);
  }, [loading]);

  if (!selectedAccount) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm p-6 text-center text-[var(--text-muted)]">
        <p className="text-3xl mb-2 opacity-40">👆</p>
        <p className="text-sm font-medium">Click a node in the graph to run the investigation pipeline</p>
        <p className="text-xs mt-1 opacity-60">3 agents will fire: Alert → Case Builder → Explanation</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="spinner"></div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-sm">Investigating account <span className="font-mono">{selectedAccount}</span>…</p>
              <p className="text-xs text-[var(--risk-info)] mt-0.5 font-mono">{LOADING_MESSAGES[loadingMsgIndex]}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-16 rounded-lg"></div>
            <div className="skeleton h-16 rounded-lg"></div>
            <div className="skeleton h-16 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!investigation) {
    return <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm p-6 text-center text-[var(--text-muted)]"><p className="text-sm">No investigation data for account {selectedAccount}</p></div>;
  }
  return (
    <div className="space-y-4">
      <AgentTrace investigation={investigation} />
      <AlertPanel alert={investigation.alert} />
      <CasePanel caseReport={investigation.case} />
      <ExplanationPanel explanation={investigation.explanation} />
    </div>
  );
}
