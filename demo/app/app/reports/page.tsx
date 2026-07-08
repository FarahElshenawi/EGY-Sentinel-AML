/**
 * Reports — compliance table view of all cases.
 *
 * Uses /api/v1/cases for consistent risk scores across all pages.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError, type CaseSummary } from '@/lib/api';
import TopBar from '@/components/organisms/TopBar';
import Badge from '@/components/atoms/Badge';
import Spinner from '@/components/atoms/Spinner';
import { fmtMoney } from '@/lib/format';

export default function ReportsPage() {
  const [reports, setReports] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getCases()
      .then((data) => {
        if (!cancelled) setReports(data.cases);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load reports.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <TopBar title="Reports" />
      <div className="px-8 py-6 max-w-[1000px]">
        <div className="mb-6">
          <h2 className="text-[24px] font-semibold text-[var(--ink-primary)] mb-1">Investigation reports</h2>
          <p className="text-[13px] text-[var(--ink-secondary)]">
            Generated case reports ready for compliance review or regulatory submission.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <Spinner size={28} className="mx-auto mb-3" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 text-[var(--ink-muted)]">{error}</div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-12 text-[var(--ink-muted)] text-sm">No reports available yet.</div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--bg-inset)] border-b border-[var(--border)] text-left">
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Account</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Pattern</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Risk</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Accounts</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Amount</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.account_id} className="border-b border-[var(--border)] hover:bg-[var(--bg-inset)] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--ink-primary)]">{r.account_id}</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">{r.pattern_label}</td>
                    <td className="px-4 py-3"><Badge color={r.risk_band} size="xs">{r.risk_band} · {r.risk_score}</Badge></td>
                    <td className="px-4 py-3 tabular text-[var(--ink-secondary)]">{r.accounts_in_pattern}</td>
                    <td className="px-4 py-3 tabular text-[var(--ink-primary)]">{fmtMoney(r.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/app/cases/${r.account_id}`} className="text-[var(--brand-blue)] hover:underline text-[12px] font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
