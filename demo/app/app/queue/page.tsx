/**
 * Investigation Queue — the app homepage.
 * Answers "what should I investigate first?" in one glance.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, ApiError } from '@/lib/api';
import type { DetectResponse, PatternType } from '@/types';
import TopBar from '@/components/organisms/TopBar';
import CaseRow from '@/components/molecules/CaseRow';
import FilterChip from '@/components/molecules/FilterChip';
import Spinner from '@/components/atoms/Spinner';

interface CaseItem {
  id: string;
  patternType: PatternType;
  patternLabel: string;
  riskScore: number;
  riskBand: 'low' | 'medium' | 'high';
  description: string;
  accountsInPattern: number;
}

function bandFromScore(score: number): 'low' | 'medium' | 'high' {
  if (score >= 66) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

function patternLabel(detector: string): string {
  switch (detector) {
    case 'circular': return 'Circular';
    case 'fan_out': return 'Fan-Out';
    case 'dense_cluster': return 'Dense Cluster';
    default: return 'None';
  }
}

function buildCases(data: DetectResponse): CaseItem[] {
  const accountMap = new Map<string, CaseItem>();
  for (const p of data.patterns) {
    const score = Math.round((p.score_raw || 0) * 100);
    for (const acc of p.accounts) {
      const existing = accountMap.get(acc);
      if (!existing || score > existing.riskScore) {
        accountMap.set(acc, {
          id: acc,
          patternType: p.detector,
          patternLabel: patternLabel(p.detector),
          riskScore: score,
          riskBand: bandFromScore(score),
          description: p.evidence?.description || `${patternLabel(p.detector)} pattern detected`,
          accountsInPattern: p.accounts.length,
        });
      }
    }
  }
  return Array.from(accountMap.values()).sort((a, b) => b.riskScore - a.riskScore);
}

type FilterType = 'all' | PatternType;

export default function QueuePage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.detect()
      .then((data) => { if (!cancelled) setCases(buildCases(data)); })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load cases.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = cases;
    if (filter !== 'all') result = result.filter((c) => c.patternType === filter);
    if (search.trim()) result = result.filter((c) => c.id.toLowerCase().includes(search.trim().toLowerCase()));
    return result;
  }, [cases, filter, search]);

  const counts = useMemo(() => ({
    all: cases.length,
    circular: cases.filter((c) => c.patternType === 'circular').length,
    fan_out: cases.filter((c) => c.patternType === 'fan_out').length,
    dense_cluster: cases.filter((c) => c.patternType === 'dense_cluster').length,
    critical: cases.filter((c) => c.riskScore >= 85).length,
    high: cases.filter((c) => c.riskScore >= 66 && c.riskScore < 85).length,
  }), [cases]);

  return (
    <>
      <TopBar title="Investigation Queue">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search account ID…"
          className="bg-[var(--bg-inset)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5 text-[13px] w-[240px] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface)]"
        />
      </TopBar>

      <div className="px-8 py-6 max-w-[1200px]">
        <div className="mb-6">
          <h2 className="text-[24px] font-semibold text-[var(--ink-primary)] mb-1">Cases</h2>
          <div className="flex gap-6 text-[13px] text-[var(--ink-secondary)]">
            <span><strong className="tabular text-[var(--ink-primary)]">{cases.length}</strong> flagged accounts</span>
            <span><strong className="tabular text-[var(--risk-critical)]">{counts.critical}</strong> critical</span>
            <span><strong className="tabular text-[var(--risk-high)]">{counts.high}</strong> high risk</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <FilterChip label="All" count={counts.all} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Circular" count={counts.circular} active={filter === 'circular'} onClick={() => setFilter('circular')} />
          <FilterChip label="Fan-Out" count={counts.fan_out} active={filter === 'fan_out'} onClick={() => setFilter('fan_out')} />
          <FilterChip label="Dense Cluster" count={counts.dense_cluster} active={filter === 'dense_cluster'} onClick={() => setFilter('dense_cluster')} />
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Spinner size={28} className="mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-muted)]">Scanning transactions for suspicious patterns…</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-lg text-center px-6 py-16">
            <p className="text-lg font-semibold text-[var(--risk-critical)] mb-2">Couldn&apos;t load cases</p>
            <p className="text-sm text-[var(--ink-muted)]">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="max-w-lg text-center px-6 py-16">
            <p className="text-3xl mb-2 opacity-40">✓</p>
            <p className="text-sm font-medium text-[var(--ink-muted)]">
              {cases.length === 0 ? 'No alerts require your attention.' : 'No cases match your filter.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((c) => (
              <CaseRow
                key={c.id}
                id={c.id}
                pattern={c.patternType}
                patternLabel={c.patternLabel}
                riskScore={c.riskScore}
                riskBand={c.riskBand}
                riskLevel={c.riskScore >= 85 ? 'critical' : c.riskScore >= 66 ? 'high' : c.riskScore >= 31 ? 'medium' : 'low'}
                description={c.description}
                accountsInPattern={c.accountsInPattern}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
