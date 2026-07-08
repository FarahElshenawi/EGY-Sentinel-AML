/**
 * Investigation Queue — the app homepage.
 *
 * Uses /api/v1/cases which returns the REAL risk score from
 * combine_account() — not the detector's pattern confidence.
 * This ensures the score shown here matches /investigate.
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { api, ApiError, type CaseSummary, type CasesSummaryResponse } from '@/lib/api';
import TopBar from '@/components/organisms/TopBar';
import CaseRow from '@/components/molecules/CaseRow';
import FilterChip from '@/components/molecules/FilterChip';
import Spinner from '@/components/atoms/Spinner';

type FilterType = 'all' | 'circular' | 'fan_out' | 'dense_cluster';

export default function QueuePage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [stats, setStats] = useState<CasesSummaryResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getCases()
      .then((data) => {
        if (cancelled) return;
        setCases(data.cases);
        setStats(data.stats);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load cases.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = cases;
    if (filter !== 'all') result = result.filter((c) => c.pattern_type === filter);
    if (search.trim()) result = result.filter((c) => c.account_id.toLowerCase().includes(search.trim().toLowerCase()));
    return result;
  }, [cases, filter, search]);

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
            <span><strong className="tabular text-[var(--ink-primary)]">{stats?.total_cases || 0}</strong> flagged accounts</span>
            <span><strong className="tabular text-[var(--risk-critical)]">{stats?.critical || 0}</strong> critical</span>
            <span><strong className="tabular text-[var(--risk-high)]">{stats?.high || 0}</strong> high risk</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <FilterChip label="All" count={stats?.total_cases} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Circular" count={stats?.circular} active={filter === 'circular'} onClick={() => setFilter('circular')} />
          <FilterChip label="Fan-Out" count={stats?.fan_out} active={filter === 'fan_out'} onClick={() => setFilter('fan_out')} />
          <FilterChip label="Dense Cluster" count={stats?.dense_cluster} active={filter === 'dense_cluster'} onClick={() => setFilter('dense_cluster')} />
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Spinner size={28} className="mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-muted)]">Loading cases…</p>
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
                key={c.account_id}
                id={c.account_id}
                pattern={c.pattern_type as any}
                patternLabel={c.pattern_label}
                riskScore={c.risk_score}
                riskBand={c.risk_band}
                riskLevel={c.priority as any}
                description={c.description}
                accountsInPattern={c.accounts_in_pattern}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
