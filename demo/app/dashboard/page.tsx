'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import KpiStrip from '@/components/KpiStrip';
import GraphCanvas from '@/components/GraphCanvas';
import type { GraphResponse } from '@/types';
import { api, ApiError } from '@/lib/api';

/**
 * Dashboard = Overview. It answers "how is the bank doing right now"
 * and lets an investigator spot something worth a closer look on the
 * map. It intentionally does NOT open an investigation inline — that
 * lives in its own uncluttered workspace at /cases/[id].
 */
export default function DashboardPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = useCallback(async () => {
    setLoadingGraph(true);
    setError(null);
    try {
      const data = await api.getGraph();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the transaction map');
    } finally {
      setLoadingGraph(false);
    }
  }, []);

  const handleNodeClick = useCallback((accountId: string) => {
    router.push(`/cases/${accountId}`);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-app)' }}>
      <div className="bg-[#060B14] text-[var(--text-secondary)] px-6 py-1.5 flex items-center justify-between text-[10px] font-mono border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-low)] animate-pulse"></span>SYSTEM: HEALTHY</span>
          <span className="opacity-50">│</span><span>MODE: <span className="text-[var(--accent)]">LIVE</span></span>
        </div>
        <div className="flex items-center gap-4 opacity-70"><span>FARAH ●</span></div>
      </div>

      <Header onLoadSample={handleLoadSample} loading={loadingGraph} />

      <main className="flex-1 px-6 py-4">
        <KpiStrip />

        {error && (
          <div className="bg-[rgba(220,38,38,0.15)] border-l-4 border-[var(--risk-critical)] p-4 mb-4 rounded-r">
            <p className="text-sm text-[var(--risk-critical)]">{error}</p>
          </div>
        )}

        <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
          <div className="border-b border-[var(--border-default)] px-4 py-2.5 bg-[var(--bg-subtle)]">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
              Transaction Map
              {graphData && (
                <span className="text-xs font-normal text-[var(--text-muted)] tabular">
                  {graphData.stats.node_count || graphData.nodes.length} accounts · {graphData.stats.edge_count || graphData.edges.length} transfers
                </span>
              )}
            </h2>
          </div>
          <div className="h-[calc(100vh-260px)] relative">
            {loadingGraph ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="spinner mx-auto mb-2" style={{ width: 32, height: 32 }}></div>
                  <p className="text-sm text-[var(--text-muted)] font-mono">Loading map…</p>
                </div>
              </div>
            ) : graphData ? (
              <GraphCanvas data={graphData} onNodeClick={handleNodeClick} selectedNode={null} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-[var(--text-muted)]">
                  <p className="text-3xl mb-2 opacity-40">📊</p>
                  <p className="text-sm font-medium">Load the sample scenario to see the transaction map</p>
                  <p className="text-xs mt-1 opacity-60">Click any account to open its case</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
