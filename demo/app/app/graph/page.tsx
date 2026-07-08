/**
 * Graph Explorer — full-screen transaction network.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { DetectResponse, GraphResponse } from '@/types';
import TopBar from '@/components/organisms/TopBar';
import FilterChip from '@/components/molecules/FilterChip';
import Badge from '@/components/atoms/Badge';
import Spinner from '@/components/atoms/Spinner';
import GraphCanvas from '@/components/GraphCanvas';

type FilterType = 'all' | 'circular' | 'fan_out' | 'dense_cluster';

interface AccountInfo {
  id: string;
  pattern: string;
  patternLabel: string;
  riskScore: number;
  riskBand: 'low' | 'medium' | 'high';
  accountsInPattern: number;
}

function patternLabel(detector: string): string {
  switch (detector) {
    case 'circular': return 'Circular';
    case 'fan_out': return 'Fan-Out';
    case 'dense_cluster': return 'Dense Cluster';
    default: return 'None';
  }
}

function bandFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 66) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

export default function GraphExplorerPage() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [detectData, setDetectData] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getGraph(), api.detect()])
      .then(([graph, detect]) => {
        if (cancelled) return;
        setGraphData(graph);
        setDetectData(detect);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the transaction network.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const accountMap = useMemo(() => {
    const map = new Map<string, AccountInfo>();
    if (!detectData) return map;
    for (const p of detectData.patterns) {
      const score = Math.round((p.score_raw || 0) * 100);
      for (const acc of p.accounts) {
        const existing = map.get(acc);
        if (!existing || score > existing.riskScore) {
          map.set(acc, {
            id: acc,
            pattern: p.detector,
            patternLabel: patternLabel(p.detector),
            riskScore: score,
            riskBand: bandFromScore(score),
            accountsInPattern: p.accounts.length,
          });
        }
      }
    }
    return map;
  }, [detectData]);

  const filteredGraph = useMemo(() => {
    if (!graphData || filter === 'all') return graphData;
    const flaggedInFilter = new Set<string>();
    if (detectData) {
      for (const p of detectData.patterns) {
        if (p.detector === filter) {
          for (const acc of p.accounts) flaggedInFilter.add(acc);
        }
      }
    }
    const nodesToKeep = new Set<string>(flaggedInFilter);
    for (const edge of graphData.edges) {
      if (flaggedInFilter.has(edge.source)) nodesToKeep.add(edge.target);
      if (flaggedInFilter.has(edge.target)) nodesToKeep.add(edge.source);
    }
    return {
      nodes: graphData.nodes.filter((n) => nodesToKeep.has(n.id)),
      edges: graphData.edges.filter((e) => nodesToKeep.has(e.source) && nodesToKeep.has(e.target)),
      stats: graphData.stats,
    };
  }, [graphData, detectData, filter]);

  const counts = useMemo(() => {
    if (!detectData) return { all: 0, circular: 0, fan_out: 0, dense_cluster: 0 };
    const c = { all: 0, circular: 0, fan_out: 0, dense_cluster: 0 };
    const seen = new Set<string>();
    for (const p of detectData.patterns) {
      for (const acc of p.accounts) {
        const key = `${p.detector}-${acc}`;
        if (!seen.has(key)) {
          if (p.detector in c) (c as Record<string, number>)[p.detector]++;
          c.all++;
          seen.add(key);
        }
      }
    }
    return c;
  }, [detectData]);

  const selectedInfo = selectedNode ? accountMap.get(selectedNode) : null;

  return (
    <>
      <TopBar title="Graph Explorer" />
      <div className="relative h-[calc(100vh-56px)]">
        <div className="absolute top-4 left-4 z-10 flex gap-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-1.5 shadow-[var(--shadow)]">
          <FilterChip label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Circular" count={counts.circular} active={filter === 'circular'} onClick={() => setFilter('circular')} />
          <FilterChip label="Fan-Out" count={counts.fan_out} active={filter === 'fan_out'} onClick={() => setFilter('fan_out')} />
          <FilterChip label="Dense Cluster" count={counts.dense_cluster} active={filter === 'dense_cluster'} onClick={() => setFilter('dense_cluster')} />
        </div>

        {graphData && (
          <div className="absolute top-4 right-4 z-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2.5 shadow-[var(--shadow)] text-[12px]">
            <div className="flex gap-4 tabular">
              <span><strong className="text-[var(--ink-primary)]">{filteredGraph?.nodes.length || 0}</strong> <span className="text-[var(--ink-muted)]">nodes</span></span>
              <span><strong className="text-[var(--ink-primary)]">{filteredGraph?.edges.length || 0}</strong> <span className="text-[var(--ink-muted)]">edges</span></span>
              <span><strong className="text-[var(--ink-primary)]">{detectData?.total_patterns || 0}</strong> <span className="text-[var(--ink-muted)]">patterns</span></span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Spinner size={32} className="mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-muted)]">Mapping the transaction network…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center h-full">
            <div className="max-w-md text-center px-6">
              <p className="text-lg font-semibold text-[var(--risk-critical)] mb-2">Couldn&apos;t load the graph</p>
              <p className="text-sm text-[var(--ink-muted)]">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && filteredGraph && (
          <GraphCanvas data={filteredGraph} onNodeClick={(id) => setSelectedNode(id)} selectedNode={selectedNode} />
        )}

        {selectedInfo && (
          <div className="absolute right-4 top-20 bottom-4 w-[280px] z-10 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] p-5 flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)]">Selected account</h4>
              <button onClick={() => setSelectedNode(null)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors" aria-label="Close drawer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="font-mono text-[18px] font-bold text-[var(--ink-primary)] mb-3">{selectedInfo.id}</div>
            <div className="flex items-center gap-2 mb-4">
              <Badge color={selectedInfo.riskBand} size="sm">{selectedInfo.riskBand}</Badge>
              <Badge color="orange" size="sm">{selectedInfo.patternLabel}</Badge>
            </div>
            <div className="space-y-0">
              <div className="flex justify-between py-2 border-b border-[var(--border)] text-[13px]">
                <span className="text-[var(--ink-muted)]">Risk score</span>
                <span className="tabular font-semibold text-[var(--ink-primary)]">{selectedInfo.riskScore}/100</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)] text-[13px]">
                <span className="text-[var(--ink-muted)]">Pattern</span>
                <span className="text-[var(--ink-primary)]">{selectedInfo.patternLabel}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)] text-[13px]">
                <span className="text-[var(--ink-muted)]">Accounts in pattern</span>
                <span className="tabular text-[var(--ink-primary)]">{selectedInfo.accountsInPattern}</span>
              </div>
            </div>
            <Link href={`/app/cases/${selectedInfo.id}`} className="mt-auto block bg-[var(--brand-navy)] text-white text-center py-2.5 rounded-[var(--radius)] text-[13px] font-semibold hover:bg-[var(--brand-navy-hover)] transition-colors">
              Open case →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
