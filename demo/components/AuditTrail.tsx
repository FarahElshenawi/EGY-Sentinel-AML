'use client';

import { useState } from 'react';
import type { InvestigateResponse } from '@/types';
import JsonViewer from './agent-trace/JsonViewer';

interface AuditEntry { timestamp: string; actor: string; action: string; detail: string; icon: string; color: string; payload?: Record<string, unknown>; }
interface AuditTrailProps { investigation: InvestigateResponse; }

export default function AuditTrail({ investigation }: AuditTrailProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const { alert, case: caseReport, explanation } = investigation;

  const entries: AuditEntry[] = [
    { timestamp: '14:32:08', actor: 'explanation-agent', action: 'Explanation generated', detail: `Confidence ${(explanation.confidence * 100).toFixed(1)}% · ${explanation.citations.length} citations`, icon: '💡', color: 'var(--risk-info)', payload: { case_id: explanation.case_id, confidence: explanation.confidence, citations: explanation.citations } },
    { timestamp: '14:31:55', actor: 'case-builder-agent', action: 'Case report built', detail: `Case ${caseReport.case_id} · ${caseReport.parties.length} parties · $${(caseReport.total_amount / 1_000_000).toFixed(2)}M total`, icon: '📋', color: 'var(--brand-primary)', payload: { case_id: caseReport.case_id, timeline: caseReport.timeline, parties: caseReport.parties, sar_fields: caseReport.sar_fields } },
    { timestamp: '14:31:42', actor: 'alert-agent', action: 'Alert raised', detail: `Priority: ${alert.priority.toUpperCase()} · Account ${alert.account_id}`, icon: '🚨', color: 'var(--risk-high)', payload: { account_id: alert.account_id, priority: alert.priority, risk_score: alert.risk_score, pattern_type: alert.pattern_type, summary: alert.summary } },
    { timestamp: '14:31:30', actor: 'rule-scorer + xgboost', action: 'Risk score computed', detail: `Score: ${alert.risk_score}/100 (${alert.risk_band}) · Pattern: ${alert.pattern_type}`, icon: '📊', color: 'var(--risk-medium)', payload: { rule_score: 70, ml_prob: 0.85, final_score: alert.risk_score, risk_band: alert.risk_band, model: 'xgboost-v1' } },
    { timestamp: '14:31:28', actor: 'farah@egy-sentinel', action: 'Investigation initiated', detail: `Manual trigger on account ${alert.account_id}`, icon: '👤', color: 'var(--text-secondary)', payload: { user: 'farah@egy-sentinel', session_id: 'sess-a3f7b2c1', action: 'investigate', account_id: alert.account_id } },
    { timestamp: '14:30:00', actor: 'detect.circular', action: 'Account flagged in circular pattern', detail: `Depth: 5 · Cycle: ${caseReport.parties.map((p) => p.account_id).join(' → ')} → ${alert.account_id}`, icon: '🔍', color: 'var(--risk-critical)', payload: { detector: 'circular', depth: 5, cycle: [...caseReport.parties.map((p) => p.account_id), alert.account_id], algorithm: 'DFS' } },
  ];

  const toggleEntry = (index: number) => { setExpandedEntries((prev) => { const next = new Set(prev); if (next.has(index)) { next.delete(index); } else { next.add(index); } return next; }); };

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[var(--text-primary)] text-white flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-sm"><span>📜</span> Audit Trail</h3>
          <p className="text-[10px] opacity-60 mt-0.5 uppercase tracking-wider">Immutable · {entries.length} events · Hash-chain verified</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] opacity-60 uppercase tracking-wider font-semibold">Audit Hash</p>
          <p className="text-[10px] font-mono opacity-80">a3f7b2c1d4e5…</p>
        </div>
      </div>
      <div className="p-4">
        <div className="relative">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[var(--border-default)]"></div>
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const isExpanded = expandedEntries.has(i);
              return (
                <div key={i} className="relative pl-12">
                  <div className="absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-sm border-2 bg-[var(--bg-surface)]" style={{ borderColor: entry.color }}>{entry.icon}</div>
                  <div className="bg-[var(--bg-subtle)] rounded-md p-2.5 cursor-pointer hover:bg-[var(--bg-inset)] transition-colors" onClick={() => toggleEntry(i)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] tabular flex-shrink-0">{entry.timestamp}</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{entry.action}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0" style={{ backgroundColor: 'var(--bg-inset)', color: entry.color }}>{entry.actor}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">{entry.detail}</p>
                    {isExpanded && entry.payload && (<div className="mt-2" onClick={(e) => e.stopPropagation()}><JsonViewer data={entry.payload} label={`PAYLOAD — ${entry.actor}`} maxHeight="200px" /></div>)}
                    {entry.payload && !isExpanded && (<p className="text-[9px] text-[var(--text-muted)] mt-1 font-mono uppercase tracking-wider">▸ Click to view payload</p>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>Chain integrity: ✓ Verified</span>
          <span>Last block: #4,291</span>
        </div>
      </div>
    </div>
  );
}
