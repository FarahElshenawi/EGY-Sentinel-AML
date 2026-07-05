'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import KpiStrip from '@/components/KpiStrip';
import GraphCanvas from '@/components/GraphCanvas';
import SidePanel from '@/components/SidePanel';
import AuditTrail from '@/components/AuditTrail';
import ConfirmModal from '@/components/ConfirmModal';
import type { GraphResponse, InvestigateResponse } from '@/types';
import { api, ApiError } from '@/lib/api';

export default function DashboardPage() {
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<InvestigateResponse | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingInvestigation, setLoadingInvestigation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean; type: 'escalate' | 'fileSAR' | null }>({ open: false, type: null });
  const [toast, setToast] = useState<string | null>(null);

  const handleLoadSample = useCallback(async () => {
    setLoadingGraph(true); setError(null); setInvestigation(null); setSelectedAccount(null);
    try { const data = await api.getGraph(); setGraphData(data); } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to load graph'); } finally { setLoadingGraph(false); }
  }, []);

  const handleNodeClick = useCallback(async (accountId: string) => {
    setSelectedAccount(accountId); setLoadingInvestigation(true); setError(null); setInvestigation(null);
    try { const data = await api.investigate(accountId); setInvestigation(data); } catch (err) { setError(err instanceof ApiError ? err.message : 'Failed to investigate account'); } finally { setLoadingInvestigation(false); }
  }, []);

  const handleConfirm = (reason: string) => {
    if (modalState.type === 'escalate') { setToast(`✓ Case escalated to compliance team. Reason logged: "${reason.slice(0, 40)}${reason.length > 40 ? '…' : ''}"`); }
    else if (modalState.type === 'fileSAR') { setToast(`✓ SAR filed for ${investigation?.case.case_id}. Reason logged: "${reason.slice(0, 40)}${reason.length > 40 ? '…' : ''}"`); }
    setModalState({ open: false, type: null }); setTimeout(() => setToast(null), 6000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-app)' }}>
      <div className="bg-[#060B14] text-[var(--text-secondary)] px-6 py-1.5 flex items-center justify-between text-[10px] font-mono border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-low)] animate-pulse"></span>SYSTEM: HEALTHY</span>
          <span className="opacity-50">│</span><span>MODE: <span className="text-[var(--accent)]">LIVE</span></span>
          <span className="opacity-50">│</span><span>v0.3.0</span>
        </div>
        <div className="flex items-center gap-4 opacity-70"><span>FARAH ●</span></div>
      </div>
      <Header onLoadSample={handleLoadSample} loading={loadingGraph} />
      <main className="flex-1 px-6 py-4">
        <KpiStrip />
        {error && (
          <div className="bg-[rgba(220,38,38,0.15)] border-l-4 border-[var(--risk-critical)] p-4 mb-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0"><span className="text-[var(--risk-critical)] text-xl">⚠</span></div>
              <div className="ml-3">
                <p className="text-sm text-[var(--risk-critical)]">{error}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Make sure the FastAPI server is running: <code className="bg-[var(--bg-inset)] px-1.5 py-0.5 rounded font-mono text-[11px]">uvicorn egysentinel.api.main:app --reload</code></p>
              </div>
            </div>
          </div>
        )}
        {toast && (<div className="fixed top-20 right-6 z-40 bg-[var(--text-primary)] text-white px-4 py-3 rounded-lg shadow-xl border-l-4 border-[var(--risk-low)] max-w-md"><p className="text-sm">{toast}</p></div>)}
        <div className="flex gap-4">
          <div className="flex-[3] bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
            <div className="border-b border-[var(--border-default)] px-4 py-2.5 bg-[var(--bg-subtle)]">
              <h2 className="font-semibold text-[var(--text-primary)] text-sm flex items-center gap-2">
                Transaction Graph
                {graphData && (<span className="text-xs font-normal text-[var(--text-muted)] tabular">{graphData.stats.node_count || graphData.nodes.length} nodes · {graphData.stats.edge_count || graphData.edges.length} edges</span>)}
              </h2>
            </div>
            <div className="h-[calc(100vh-280px)] relative">
              {loadingGraph ? (
                <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="spinner mx-auto mb-2" style={{ width: 32, height: 32 }}></div><p className="text-sm text-[var(--text-muted)] font-mono">Loading graph…</p></div></div>
              ) : graphData ? (
                <GraphCanvas data={graphData} onNodeClick={handleNodeClick} selectedNode={selectedAccount} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"><div className="text-center text-[var(--text-muted)]"><p className="text-3xl mb-2 opacity-40">📊</p><p className="text-sm font-medium">Click &ldquo;Load Sample Scenario&rdquo; to visualize the transaction graph</p><p className="text-xs mt-1 opacity-60">Demo data: circular pattern A→B→C→D→A</p></div></div>
              )}
            </div>
          </div>
          <div className="flex-[2] overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <SidePanel selectedAccount={selectedAccount} investigation={investigation} loading={loadingInvestigation} />
          </div>
        </div>
        {investigation && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm p-4">
                <h3 className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-3">Investigation Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => setModalState({ open: true, type: 'escalate' })} className="w-full px-3 py-2 text-sm font-medium text-white rounded-md transition-all hover:opacity-90" style={{ backgroundColor: 'var(--risk-high)' }}>⚠ Escalate Case</button>
                  <button onClick={() => setModalState({ open: true, type: 'fileSAR' })} className="w-full px-3 py-2 text-sm font-medium text-[var(--text-primary)] rounded-md border border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] transition-colors">📄 File SAR</button>
                  <button onClick={() => setToast('✓ Case marked for review')} className="w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-subtle)] transition-colors">✓ Mark as Review</button>
                  <button onClick={() => { setSelectedAccount(null); setInvestigation(null); }} className="w-full px-3 py-2 text-sm font-medium text-[var(--text-muted)] rounded-md hover:bg-[var(--bg-subtle)] transition-colors">✕ Close Investigation</button>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border-default)] space-y-1">
                  <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Session</span><span className="font-mono text-[var(--text-secondary)]">sess-a3f7b2c1</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Opened</span><span className="font-mono text-[var(--text-secondary)] tabular">14m ago</span></div>
                  <div className="flex justify-between text-[10px]"><span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Status</span><span className="text-[var(--risk-medium)] font-semibold">OPEN</span></div>
                </div>
              </div>
            </div>
            <div className="col-span-2"><AuditTrail investigation={investigation} /></div>
          </div>
        )}
      </main>
      <ConfirmModal open={modalState.open} onClose={() => setModalState({ open: false, type: null })} onConfirm={handleConfirm}
        title={modalState.type === 'escalate' ? 'Escalate Case' : 'File SAR'} action={modalState.type === 'escalate' ? 'case.escalate' : 'sar.file'} entity={investigation?.case.case_id || 'UNKNOWN'}
        consequences={modalState.type === 'escalate' ? ['Notify the compliance team immediately', 'Lock the case from further edits', 'Be permanently recorded in the audit log'] : ['Submit a Suspicious Activity Report to FinCEN', 'Lock the case and all associated evidence', 'Be permanently recorded in the audit log']} />
    </div>
  );
}
