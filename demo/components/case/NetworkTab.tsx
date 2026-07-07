'use client';

import { useEffect, useState } from 'react';
import GraphCanvas from '@/components/GraphCanvas';
import { api, ApiError } from '@/lib/api';
import type { GraphResponse } from '@/types';

export default function NetworkTab({ accountId }: { accountId: string }) {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getGraph()
      .then((data) => { if (!cancelled) setGraphData(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load the transaction network.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="h-[calc(100vh-116px)] w-full relative bg-[var(--bg-app)]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-3" style={{ width: 28, height: 28 }} />
            <p className="text-sm text-[var(--text-muted)]">Mapping the transaction network…</p>
          </div>
        </div>
      )}
      {!loading && error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-[var(--risk-critical)]">{error}</p>
        </div>
      )}
      {!loading && graphData && (
        <GraphCanvas data={graphData} onNodeClick={() => {}} selectedNode={accountId} />
      )}
    </div>
  );
}
