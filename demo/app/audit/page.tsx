'use client';

import { useState } from 'react';
import JsonViewer from '@/components/agent-trace/JsonViewer';

// Stub audit log — full system history
const AUDIT_LOG = [
  { time: '14:32:08', user: 'alert-agent', action: 'Explanation generated', detail: 'Confidence 87.0%', severity: 'INFO' },
  { time: '14:31:55', user: 'case-builder-agent', action: 'Case report built', detail: 'CASE-0231 · 4 parties · $1.74M', severity: 'INFO' },
  { time: '14:31:42', user: 'alert-agent', action: 'Alert raised', detail: 'Priority: HIGH · Account A', severity: 'WARN' },
  { time: '14:31:30', user: 'rule-scorer + xgboost', action: 'Risk score computed', detail: 'Score: 85/100 (high)', severity: 'INFO' },
  { time: '14:31:28', user: 'farah@egy-sentinel', action: 'Investigation initiated', detail: 'Manual trigger on account A', severity: 'INFO' },
  { time: '14:30:00', user: 'detect.circular', action: 'Account flagged', detail: 'Depth: 5 · Cycle: A→B→C→D→A', severity: 'CRITICAL' },
  { time: '14:25:00', user: 'system', action: 'Graph updated', detail: '5 nodes, 5 edges loaded', severity: 'DEBUG' },
  { time: '14:20:00', user: 'farah@egy-sentinel', action: 'Sample scenario loaded', detail: 'PaySim demo data', severity: 'INFO' },
  { time: '14:15:00', user: 'system', action: 'API server started', detail: 'uvicorn on :8000', severity: 'DEBUG' },
  { time: '14:10:00', user: 'system', action: 'ML model loaded', detail: 'xgboost.joblib (v1.0)', severity: 'DEBUG' },
  { time: '14:05:00', user: 'system', action: 'GLM cache initialized', detail: '0 cached responses', severity: 'DEBUG' },
  { time: '14:00:00', user: 'farah@egy-sentinel', action: 'User logged in', detail: 'Session: sess-a3f7b2c1', severity: 'INFO' },
];

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-risk-critical-subtle text-[var(--risk-critical)] border-[var(--risk-critical)]',
  WARN: 'bg-risk-high-subtle text-[var(--risk-high)] border-[var(--risk-high)]',
  INFO: 'bg-risk-info-subtle text-[var(--risk-info)] border-[var(--risk-info)]',
  DEBUG: 'bg-[var(--bg-inset)] text-[var(--text-muted)] border-[var(--border-default)]',
};

export default function AuditPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const filteredLog = filter === 'All' ? AUDIT_LOG : AUDIT_LOG.filter((e) => e.severity === filter);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-1">Audit Center</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Immutable, hash-chain verified log of all system and user actions.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Chain Hash</p>
          <p className="text-xs font-mono text-[var(--text-secondary)]">a3f7b2c1d4e5…</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {['All', 'CRITICAL', 'WARN', 'INFO', 'DEBUG'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-auto tabular">
          {filteredLog.length} events
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border-default)]"></div>

          <div className="space-y-2">
            {filteredLog.map((entry, i) => (
              <div key={i} className="relative pl-12">
                {/* Node on timeline */}
                <div
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${severityColors[entry.severity]}`}
                >
                  {entry.severity[0]}
                </div>

                {/* Entry */}
                <div
                  className="bg-[var(--bg-subtle)] rounded-md p-2.5 cursor-pointer hover:bg-[var(--bg-inset)] transition-colors"
                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] tabular flex-shrink-0">{entry.time}</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{entry.action}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[var(--bg-inset)] text-[var(--text-secondary)] flex-shrink-0">
                      {entry.user}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{entry.detail}</p>

                  {expandedIndex === i && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <JsonViewer
                        data={{
                          timestamp: `2026-06-28 ${entry.time}`,
                          user: entry.user,
                          action: entry.action,
                          detail: entry.detail,
                          severity: entry.severity,
                          session_id: 'sess-a3f7b2c1',
                          hash: `${entry.time.replace(/:/g, '')}a3f7b2c1`,
                        }}
                        label={`AUDIT PAYLOAD — ${entry.user}`}
                        maxHeight="150px"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
          <span>Chain integrity: ✓ Verified</span>
          <span>Last block: #4,291</span>
        </div>
      </div>
    </div>
  );
}
