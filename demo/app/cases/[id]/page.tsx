'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { InvestigateResponse } from '@/types';
import CaseTabsNav, { type CaseTabId } from '@/components/case/CaseTabsNav';
import OverviewTab from '@/components/case/OverviewTab';
import NetworkTab from '@/components/case/NetworkTab';
import AuditTab from '@/components/case/AuditTab';

const priorityStyles: Record<string, { bg: string; color: string }> = {
  low: { bg: 'rgba(56,189,248,0.15)', color: 'var(--risk-info)' },
  medium: { bg: 'rgba(245,158,11,0.15)', color: 'var(--risk-medium)' },
  high: { bg: 'rgba(234,88,12,0.15)', color: 'var(--risk-high)' },
  critical: { bg: 'rgba(220,38,38,0.15)', color: 'var(--risk-critical)' },
};

export default function CaseWorkspacePage() {
  const params = useParams<{ id: string }>();
  const accountId = decodeURIComponent(params.id);

  const [tab, setTab] = useState<CaseTabId>('overview');
  const [investigation, setInvestigation] = useState<InvestigateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.investigate(accountId)
      .then((data) => { if (!cancelled) setInvestigation(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'This case could not be opened.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accountId]);

  const priorityStyle = investigation ? priorityStyles[investigation.alert.priority] || priorityStyles.medium : priorityStyles.medium;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-app)' }}>
      {/* Case header */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cases" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">← Cases</Link>
          <span className="text-[var(--border-strong)]">/</span>
          <div>
            <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)]">Account {accountId}</h1>
            {investigation && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Case {investigation.case.case_id} · <span className="capitalize">{investigation.case.pattern_type.replace('_', ' ')}</span> pattern
              </p>
            )}
          </div>
        </div>
        {investigation && (
          <span
            className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide"
            style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}
          >
            {investigation.alert.priority} priority
          </span>
        )}
      </div>

      <CaseTabsNav active={tab} onChange={setTab} />

      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="spinner mx-auto mb-3" style={{ width: 32, height: 32 }} />
              <p className="text-sm text-[var(--text-muted)]">Opening the case file…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-lg mx-auto mt-16 text-center px-6">
            <p className="text-lg font-semibold text-[var(--risk-critical)] mb-2">This case couldn&apos;t be opened</p>
            <p className="text-sm text-[var(--text-muted)]">{error}</p>
            <p className="text-xs text-[var(--text-muted)] mt-3">Make sure the Sentinel service is running and try again.</p>
          </div>
        )}

        {!loading && investigation && (
          <>
            {tab === 'overview' && <OverviewTab investigation={investigation} />}
            {tab === 'network' && <NetworkTab accountId={accountId} />}
            {tab === 'audit' && <AuditTab investigation={investigation} />}
          </>
        )}
      </div>
    </div>
  );
}
