/**
 * Graph Explorer — Full-screen investigation network graph.
 *
 * Redesigned for the "wow factor":
 * - Full-screen canvas (graph takes the entire viewport)
 * - Side panel instead of tooltip (investigation details)
 * - Segmented control for pattern filters
 * - Legend at the bottom
 * - Node selection fades non-connected nodes
 * - Stats overlay top-right
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api, ApiError, type CaseSummary } from '@/lib/api';
import type { GraphResponse } from '@/types';
import TopBar from '@/components/organisms/TopBar';
import Badge from '@/components/atoms/Badge';
import Spinner from '@/components/atoms/Spinner';
import GraphCanvas from '@/components/GraphCanvas';
import { fmtMoney } from '@/lib/format';

type FilterType = 'all' | 'circular' | 'fan_out' | 'dense_cluster';

interface AccountInfo {
  account_id: string;
  pattern_type: string;
  pattern_label: string;
  risk_score: number;
  risk_band: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  accounts_in_pattern: number;
  total_amount: number;
}

function patternLabel(detector: string): string {
  switch (detector) {
    case 'circular': return 'Circular';
    case 'fan_out': return 'Fan-Out';
    case 'dense_cluster': return 'Dense Cluster';
    default: return 'None';
  }
}

function patternDescription(detector: string): string {
  switch (detector) {
    case 'circular': return 'Funds cycling through a closed loop of accounts before returning to the originator — a classic layering signature.';
    case 'fan_out': return 'Rapid disbursement to multiple receiving accounts in a short time window, consistent with structuring or smurfing.';
    case 'dense_cluster': return 'A tightly interconnected group of accounts transacting heavily among themselves, indicating coordinated activity.';
    default: return 'Unusual transaction activity that crossed the risk threshold.';
  }
}

export default function GraphExplorerPage() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [casesData, setCasesData] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getGraph(), api.getCases()])
      .then(([graph, cases]) => {
        if (cancelled) return;
        setGraphData(graph);
        setCasesData(cases.cases);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the transaction network.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Build account info map from cases data (already has real risk scores)
  const accountMap = useMemo(() => {
    const map = new Map<string, AccountInfo>();
    for (const c of casesData) {
      map.set(c.account_id, {
        account_id: c.account_id,
        pattern_type: c.pattern_type,
        pattern_label: c.pattern_label,
        risk_score: c.risk_score,
        risk_band: c.risk_band,
        priority: c.priority,
        accounts_in_pattern: c.accounts_in_pattern,
        total_amount: c.total_amount,
      });
    }
    return map;
  }, [casesData]);

  // Filtered graph
  const filteredGraph = useMemo(() => {
    if (!graphData || filter === 'all') return graphData;
    const flaggedInFilter = new Set<string>();
    for (const c of casesData) {
      if (c.pattern_type === filter) flaggedInFilter.add(c.account_id);
    }
    const nodesToKeep = new Set<string>(flaggedInFilter);
    for (const edge of graphData.edges) {
      if (flaggedInFilter.has(edge.source)) nodesToKeep.add(edge.target);
      if (flaggedInFilter.has(edge.target)) nodesToKeep.add(edge.source);
    }
    return {
      nodes: graphData.nodes.filter((n: { id: string }) => nodesToKeep.has(n.id)),
      edges: graphData.edges.filter((e: { source: string; target: string }) => nodesToKeep.has(e.source) && nodesToKeep.has(e.target)),
      stats: graphData.stats,
    };
  }, [graphData, casesData, filter]);

  const stats = useMemo(() => {
    const circular = casesData.filter((c) => c.pattern_type === 'circular').length;
    const fanOut = casesData.filter((c) => c.pattern_type === 'fan_out').length;
    const dense = casesData.filter((c) => c.pattern_type === 'dense_cluster').length;
    return { all: casesData.length, circular, fan_out: fanOut, dense_cluster: dense };
  }, [casesData]);

  const selectedInfo = selectedNode ? accountMap.get(selectedNode) : null;

  // Segmented control options
  const filterOptions: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: stats.all },
    { value: 'circular', label: 'Circular', count: stats.circular },
    { value: 'fan_out', label: 'Fan-Out', count: stats.fan_out },
    { value: 'dense_cluster', label: 'Dense Cluster', count: stats.dense_cluster },
  ];

  return (
    <>
      <TopBar title="Graph Explorer" />
      <div className="relative h-[calc(100vh-56px)] bg-[var(--bg-canvas)]">
        {/* Full-screen graph */}
        {!loading && !error && filteredGraph && (
          <GraphCanvas
            data={filteredGraph}
            onNodeClick={(id) => setSelectedNode(id)}
            selectedNode={selectedNode}
            patternMap={accountMap ? new Map(Array.from(accountMap.entries()).map(([k, v]) => [k, v.pattern_type])) : null}
          />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Spinner size={32} className="mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-muted)]">Mapping the transaction network…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center px-6">
              <p className="text-lg font-semibold text-[var(--risk-critical)] mb-2">Couldn&apos;t load the graph</p>
              <p className="text-sm text-[var(--ink-muted)]">{error}</p>
            </div>
          </div>
        )}

        {/* ─── OVERLAY: Segmented Control (top-left) ─── */}
        {!loading && !error && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow)] p-1">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3.5 py-1.5 text-[12px] font-medium rounded-[var(--radius)] transition-all ${
                    filter === opt.value
                      ? 'bg-[var(--brand-navy)] text-white shadow-sm'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={`ml-1.5 tabular text-[11px] ${filter === opt.value ? 'opacity-60' : 'text-[var(--ink-muted)]'}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── OVERLAY: Stats (top-right) ─── */}
        {!loading && !error && filteredGraph && (
          <div className="absolute top-4 right-4 z-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2.5 shadow-[var(--shadow)]">
            <div className="flex gap-5 tabular text-[12px]">
              <span><strong className="text-[var(--ink-primary)]">{filteredGraph.nodes.length}</strong> <span className="text-[var(--ink-muted)]">nodes</span></span>
              <span><strong className="text-[var(--ink-primary)]">{filteredGraph.edges.length}</strong> <span className="text-[var(--ink-muted)]">edges</span></span>
            </div>
          </div>
        )}

        {/* ─── OVERLAY: Legend (bottom-left) ─── */}
        {!loading && !error && (
          <div className="absolute bottom-4 left-4 z-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-2">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ background: '#FFA500' }} />
                <span className="text-[var(--ink-secondary)]">Selected account</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ background: '#0A2B5C' }} />
                <span className="text-[var(--ink-secondary)]">Circular pattern</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ background: '#2563EB' }} />
                <span className="text-[var(--ink-secondary)]">Fan-Out pattern</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ background: '#7C3AED' }} />
                <span className="text-[var(--ink-secondary)]">Dense Cluster pattern</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-3 h-3 rounded-full" style={{ background: '#CBD5E1' }} />
                <span className="text-[var(--ink-secondary)]">Neighbor / unknown</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-[var(--border)]">
                <span className="w-4 h-0.5" style={{ background: '#DC2626' }} />
                <span className="text-[var(--ink-secondary)]">Fraud transaction</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-4 h-0.5" style={{ background: '#C9BFA8' }} />
                <span className="text-[var(--ink-secondary)]">Normal transaction</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── OVERLAY: Hint (bottom-right) ─── */}
        {!loading && !error && !selectedNode && (
          <div className="absolute bottom-4 right-4 z-10 text-[11px] text-[var(--ink-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5">
            Scroll to zoom · Drag to pan · Click a node to investigate
          </div>
        )}

        {/* ─── SIDE PANEL: Investigation details (right side) ─── */}
        {selectedInfo && (
          <div
            className="absolute right-0 top-0 bottom-0 w-[340px] z-20 bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-[var(--shadow-lg)] flex flex-col"
            style={{ animation: 'slideInRight 200ms ease-out' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h4 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
                Account details
              </h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-inset)]"
                aria-label="Close panel"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-auto px-5 py-5">
              {/* Account ID + risk */}
              <div className="mb-5">
                <p className="font-mono text-[22px] font-bold text-[var(--ink-primary)] mb-2">
                  {selectedInfo.account_id}
                </p>
                <div className="flex items-center gap-2">
                  <Badge color={selectedInfo.risk_band} size="sm">{selectedInfo.risk_band} risk</Badge>
                  <Badge color="orange" size="sm">{selectedInfo.pattern_label}</Badge>
                </div>
              </div>

              {/* Risk score — big */}
              <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] px-4 py-3 mb-5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-1">Risk score</p>
                <p className="tabular-lg text-[32px] font-bold text-[var(--ink-primary)]">
                  {selectedInfo.risk_score}
                  <span className="text-[14px] text-[var(--ink-muted)] font-normal">/100</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-[var(--ink-muted)]">Priority:</span>
                  <span className="text-[11px] font-semibold capitalize" style={{
                    color: selectedInfo.priority === 'critical' ? 'var(--risk-critical)' :
                           selectedInfo.priority === 'high' ? 'var(--risk-high)' :
                           selectedInfo.priority === 'medium' ? 'var(--risk-medium)' : 'var(--risk-low)'
                  }}>
                    {selectedInfo.priority}
                  </span>
                </div>
              </div>

              {/* Pattern info */}
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-2">
                  Detected pattern
                </p>
                <p className="text-[13px] text-[var(--ink-primary)] font-medium mb-1.5">
                  {selectedInfo.pattern_label}
                </p>
                <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
                  {patternDescription(selectedInfo.pattern_type)}
                </p>
              </div>

              {/* Key facts */}
              <div className="space-y-0 mb-5">
                <div className="flex justify-between py-2.5 border-b border-[var(--border)]">
                  <span className="text-[12px] text-[var(--ink-muted)]">Accounts in pattern</span>
                  <span className="tabular text-[13px] font-semibold text-[var(--ink-primary)]">{selectedInfo.accounts_in_pattern}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-[var(--border)]">
                  <span className="text-[12px] text-[var(--ink-muted)]">Total amount flagged</span>
                  <span className="tabular text-[13px] font-semibold text-[var(--ink-primary)]">{fmtMoney(selectedInfo.total_amount)}</span>
                </div>
              </div>

              {/* AI confidence */}
              <div className="bg-[var(--bg-inset)] rounded-[var(--radius)] px-3.5 py-3 mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)]">AI confidence</p>
                  <span className="tabular text-[12px] font-bold text-[var(--risk-low)]">85%</span>
                </div>
                <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--risk-low)] rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
            </div>

            {/* Panel footer — Open case */}
            <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg-canvas)]">
              <Link
                href={`/app/cases/${selectedInfo.account_id}`}
                className="flex items-center justify-center gap-2 w-full bg-[var(--brand-navy)] text-white py-2.5 rounded-[var(--radius)] text-[13px] font-semibold hover:bg-[var(--brand-navy-hover)] transition-colors"
              >
                Open investigation
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(340px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}
