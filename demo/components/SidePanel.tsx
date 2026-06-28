'use client';

import type { InvestigateResponse } from '@/types';
import AlertPanel from './AlertPanel';
import CasePanel from './CasePanel';
import ExplanationPanel from './ExplanationPanel';

interface SidePanelProps {
  selectedAccount: string | null;
  investigation: InvestigateResponse | null;
  loading: boolean;
}

export default function SidePanel({ selectedAccount, investigation, loading }: SidePanelProps) {
  if (!selectedAccount) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-400">
        <p className="text-3xl mb-2">👆</p>
        <p className="text-sm">Click a node in the graph to run the investigation pipeline</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="spinner"></div>
            <div>
              <p className="font-semibold text-gray-800">Investigating account {selectedAccount}...</p>
              <p className="text-xs text-gray-500">Running Alert Agent → Case Builder → Explanation</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-400">
        <p className="text-sm">No investigation data for account {selectedAccount}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertPanel alert={investigation.alert} />
      <CasePanel caseReport={investigation.case} />
      <ExplanationPanel explanation={investigation.explanation} />
    </div>
  );
}
