'use client';

import { useState } from 'react';
import Link from 'next/link';

// Stub alert data — matches the demo scenario
const ALERTS = [
  { id: 'ALERT-001', case: 'CASE-0231', account: 'A', severity: 'HIGH', risk: 85, pattern: 'Circular', time: '14:31', status: 'Open' },
  { id: 'ALERT-002', case: 'CASE-0232', account: 'B', severity: 'HIGH', risk: 72, pattern: 'Circular', time: '14:31', status: 'Open' },
  { id: 'ALERT-003', case: 'CASE-0233', account: 'C', severity: 'MEDIUM', risk: 68, pattern: 'Circular', time: '14:31', status: 'Open' },
  { id: 'ALERT-004', case: 'CASE-0234', account: 'D', severity: 'HIGH', risk: 91, pattern: 'Circular', time: '14:31', status: 'Open' },
  { id: 'ALERT-005', case: 'CASE-0225', account: 'E', severity: 'LOW', risk: 15, pattern: 'None', time: '14:25', status: 'Closed' },
  { id: 'ALERT-006', case: 'CASE-0219', account: 'F', severity: 'CRITICAL', risk: 95, pattern: 'Fan-Out', time: '13:45', status: 'Escalated' },
  { id: 'ALERT-007', case: 'CASE-0211', account: 'G', severity: 'MEDIUM', risk: 55, pattern: 'Dense Cluster', time: '12:10', status: 'Review' },
  { id: 'ALERT-008', case: 'CASE-0205', account: 'H', severity: 'HIGH', risk: 78, pattern: 'Fan-Out', time: '11:32', status: 'Open' },
];

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-risk-critical-subtle text-[var(--risk-critical)]',
  HIGH: 'bg-risk-high-subtle text-[var(--risk-high)]',
  MEDIUM: 'bg-risk-medium-subtle text-[var(--risk-medium)]',
  LOW: 'bg-risk-low-subtle text-[var(--risk-low)]',
};

const statusColors: Record<string, string> = {
  Open: 'text-[var(--risk-info)]',
  Closed: 'text-[var(--text-muted)]',
  Escalated: 'text-[var(--risk-critical)]',
  Review: 'text-[var(--risk-medium)]',
};

export default function AlertsPage() {
  const [filter, setFilter] = useState<string>('All');

  const filteredAlerts = filter === 'All' ? ALERTS : ALERTS.filter((a) => a.severity === filter);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-1">Alert Inbox</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Things that need a look. Open one to start the investigation.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs text-[var(--text-muted)] ml-auto tabular">
          {filteredAlerts.length} alerts
        </span>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)] text-left">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Time</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Alert ID</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Account</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Severity</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Risk</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Pattern</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => (
              <tr
                key={alert.id}
                className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)] tabular">{alert.time}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">{alert.id}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)] font-medium">{alert.account}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 tabular text-xs font-bold text-[var(--text-primary)]">{alert.risk}/100</td>
                <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{alert.pattern}</td>
                <td className={`px-4 py-3 text-xs font-medium ${statusColors[alert.status]}`}>{alert.status}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/cases/${alert.account}`}
                    className="text-xs text-[var(--brand-primary)] hover:underline font-medium"
                  >
                    Open case →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
