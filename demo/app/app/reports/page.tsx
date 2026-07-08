/**
 * Reports — compliance table view of all cases.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import type { DetectResponse } from '@/types';
import TopBar from '@/components/organisms/TopBar';
import Badge from '@/components/atoms/Badge';
import Spinner from '@/components/atoms/Spinner';
import { fmtMoney } from '@/lib/format';

interface ReportRow {
  id: string;
  patternLabel: string;
  riskScore: number;
  riskBand: 'low' | 'medium' | 'high';
  accountsInPattern: number;
  totalAmount: number;
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

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.detect()
      .then((data: DetectResponse) => {
        if (cancelled) return;
        const map = new Map<string, ReportRow>();
        for (const p of data.patterns) {
          const score = Math.round((p.score_raw || 0) * 100);
          for (const acc of p.accounts) {
            const existing = map.get(acc);
            if (!existing || score > existing.riskScore) {
              map.set(acc, {
                id: acc,
                patternLabel: patternLabel(p.detector),
                riskScore: score,
                riskBand: bandFromScore(score),
                accountsInPattern: p.accounts.length,
                totalAmount: p.evidence?.total_amount || 0,
              });
            }
          }
        }
        setReports(Array.from(map.values()).sort((a, b) => b.riskScore - a.riskScore));
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
                  <tr key={r.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-inset)] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--ink-primary)]">{r.id}</td>
                    <td className="px-4 py-3 text-[var(--ink-secondary)]">{r.patternLabel}</td>
                    <td className="px-4 py-3"><Badge color={r.riskBand} size="xs">{r.riskBand} · {r.riskScore}</Badge></td>
                    <td className="px-4 py-3 tabular text-[var(--ink-secondary)]">{r.accountsInPattern}</td>
                    <td className="px-4 py-3 tabular text-[var(--ink-primary)]">{fmtMoney(r.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/app/cases/${r.id}`} className="text-[var(--brand-blue)] hover:underline text-[12px] font-medium">View →</Link>
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
