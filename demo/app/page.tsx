'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import GraphCanvas from '@/components/GraphCanvas';
import SidePanel from '@/components/SidePanel';
import type { GraphResponse, InvestigateResponse } from '@/types';
import { api, ApiError } from '@/lib/api';

export default function HomePage() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<InvestigateResponse | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the sample scenario (calls /graph endpoint)
  const handleLoadSample = useCallback(async () => {
    setLoadingGraph(true);
    setError(null);
    setInvestigation(null);
    setSelectedAccount(null);
    try {
      const data = await api.getGraph();
      setGraphData(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load graph';
      setError(msg);
    } finally {
      setLoadingGraph(false);
    }
  }, []);

  // When a node is clicked, run the full investigation pipeline
  const handleNodeClick = useCallback(async (accountId: string) => {
    setSelectedAccount(accountId);
    setLoadingInvestigation(true);
    setError(null);
    setInvestigation(null);
    try {
      const data = await api.investigate(accountId);
      setInvestigation(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to investigate account';
      setError(msg);
    } finally {
      setLoadingInvestigation(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoadSample={handleLoadSample} loading={loadingGraph} />

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">⚠</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Make sure the FastAPI server is running: <code className="bg-red-100 px-1 rounded">uvicorn egysentinel.api.main:app --reload</code>
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex gap-4 p-6">
        {/* Left: Graph (60%) */}
        <div className="flex-[3] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-800">
              Transaction Graph
              {graphData && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {graphData.stats.node_count || graphData.nodes.length} nodes · {graphData.stats.edge_count || graphData.edges.length} edges
                </span>
              )}
            </h2>
          </div>
          <div className="h-[calc(100vh-200px)] relative">
            {loadingGraph ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="spinner mx-auto mb-2" style={{ width: 32, height: 32 }}></div>
                  <p className="text-sm text-gray-500">Loading graph...</p>
                </div>
              </div>
            ) : graphData ? (
              <GraphCanvas
                data={graphData}
                onNodeClick={handleNodeClick}
                selectedNode={selectedAccount}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">📊</p>
                  <p className="text-sm">Click &ldquo;Load Sample Scenario&rdquo; to visualize the transaction graph</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Side panel (40%) */}
        <div className="flex-[2] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <SidePanel
            selectedAccount={selectedAccount}
            investigation={investigation}
            loading={loadingInvestigation}
          />
        </div>
      </main>
    </div>
  );
}
