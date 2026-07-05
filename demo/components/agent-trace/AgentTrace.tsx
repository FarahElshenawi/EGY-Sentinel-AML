'use client';

import { useMemo, useState, useEffect } from 'react';
import type { InvestigateResponse } from '@/types';
import { buildAgentTrace } from './agentData';
import AgentCard from './AgentCard';

interface AgentTraceProps { investigation: InvestigateResponse; }

export default function AgentTrace({ investigation }: AgentTraceProps) {
  const traceData = useMemo(() => buildAgentTrace(investigation), [investigation]);
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    setRevealStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    traceData.agents.forEach((_, i) => { timers.push(setTimeout(() => { setRevealStep(i + 1); }, (i + 1) * 600)); });
    return () => timers.forEach(clearTimeout);
  }, [traceData.agents.length]);

  const pipelineConfidencePercent = Math.round(traceData.pipelineConfidence * 100);
  const pipelineColor = pipelineConfidencePercent >= 80 ? 'var(--risk-low)' : pipelineConfidencePercent >= 50 ? 'var(--risk-medium)' : 'var(--risk-high)';

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[var(--text-primary)] text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-sm"><span>🧠</span> Agent Reasoning Trace</h3>
            <p className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider">Explainable AI · 3-agent pipeline</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] opacity-60 uppercase tracking-wider font-semibold">Pipeline Confidence</p>
            <p className="tabular text-lg font-bold" style={{ color: pipelineColor }}>{pipelineConfidencePercent}%</p>
            <p className="text-[9px] opacity-50 font-mono tabular">{traceData.totalDuration} total</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Pipeline Progress</span>
            <span className="tabular text-[var(--text-muted)] font-mono">{revealStep}/{traceData.agents.length} agents</span>
          </div>
          <div className="h-1 bg-[var(--bg-inset)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(revealStep / traceData.agents.length) * 100}%`, backgroundColor: 'var(--brand-primary)' }} />
          </div>
        </div>
        <div className="space-y-0">
          {traceData.agents.map((agent, i) => {
            if (i >= revealStep) {
              return (
                <div key={agent.id} className="relative">
                  <div className="bg-[var(--bg-subtle)] border border-dashed border-[var(--border-default)] rounded-lg px-4 py-3 flex items-center gap-3 opacity-50">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--bg-inset)]">
                      <span className="font-mono text-sm text-[var(--text-muted)] tabular">{agent.index}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm opacity-50">{agent.icon}</span>
                      <span className="ml-2 text-sm text-[var(--text-muted)] font-medium">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--brand-primary)] animate-spin" style={{ animationDuration: '0.8s' }}></div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">Processing…</span>
                    </div>
                  </div>
                  {i < traceData.agents.length - 1 && (<div className="flex justify-center py-1.5"><span className="text-[var(--border-strong)] text-xs">▼</span></div>)}
                </div>
              );
            }
            return <AgentCard key={agent.id} agent={agent} isLast={i === traceData.agents.length - 1} />;
          })}
        </div>
        {pipelineConfidencePercent < 60 && revealStep === traceData.agents.length && (
          <div className="mt-4 p-3 rounded-md border-l-4 flex items-center gap-2" style={{ backgroundColor: 'rgba(245,158,11,0.15)', borderLeftColor: 'var(--risk-medium)' }}>
            <span className="text-lg">⚠</span>
            <p className="text-xs text-[var(--risk-medium)] font-medium">Pipeline confidence is below 60%. This case requires human review before escalation.</p>
          </div>
        )}
        {revealStep === traceData.agents.length && (
          <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
            <p className="text-[10px] text-[var(--text-muted)] font-mono">All agent outputs logged to audit trail · Hash: a3f7b2c1…</p>
            <button className="text-[10px] text-[var(--brand-primary)] hover:underline font-medium">View full audit trail →</button>
          </div>
        )}
      </div>
    </div>
  );
}
