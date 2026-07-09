/**
 * DecisionPanel — the escalate / close / review / report actions.
 *
 * WIRED: Each button opens a modal requiring a reason, then calls the
 * real /api/v1/cases/decide endpoint. Decisions are logged to the
 * audit trail with timestamp and actor.
 *
 * Generate Report: triggers a client-side PDF download of the case file.
 */
'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { api, ApiError, type DecisionType } from '@/lib/api';
import type { InvestigateResponse } from '@/types';
import Badge from '@/components/atoms/Badge';

interface DecisionPanelProps {
  caseId: string;
  accountId: string;
  investigation?: InvestigateResponse | null;
}

const DECISION_CONFIG: Record<DecisionType, {
  label: string;
  variant: 'danger' | 'secondary' | 'ghost';
  title: string;
  reasons: string[];
  confirmLabel: string;
}> = {
  escalate: {
    label: 'Escalate',
    variant: 'danger',
    title: 'Escalate case',
    reasons: [
      'Suspected money laundering',
      'Structuring / smurfing detected',
      'Identity theft suspected',
      'Terrorist financing indicator',
      'Other (specify below)',
    ],
    confirmLabel: 'Confirm escalation',
  },
  close: {
    label: 'Close',
    variant: 'secondary',
    title: 'Close case as false positive',
    reasons: [
      'False positive — normal business activity',
      'Insufficient evidence',
      'Duplicate of existing case',
      'Already resolved',
      'Other (specify below)',
    ],
    confirmLabel: 'Close case',
  },
  needs_review: {
    label: 'Needs Review',
    variant: 'ghost',
    title: 'Send back for review',
    reasons: [
      'Needs senior investigator review',
      'Requires additional documentation',
      'Pending customer response',
      'Other (specify below)',
    ],
    confirmLabel: 'Send for review',
  },
  generate_report: {
    label: 'Generate Report',
    variant: 'secondary',
    title: 'Generate investigation report',
    reasons: [
      'SAR filing preparation',
      'Regulatory submission',
      'Internal compliance review',
      'Management reporting',
    ],
    confirmLabel: 'Generate report',
  },
};

export default function DecisionPanel({ caseId, accountId, investigation }: DecisionPanelProps) {
  const [activeDecision, setActiveDecision] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openModal = (type: DecisionType) => {
    setActiveDecision(type);
    setReason('');
    setDetail('');
    setError(null);
    setSuccess(null);
  };

  const closeModal = () => {
    setActiveDecision(null);
    setReason('');
    setDetail('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!activeDecision) return;
    const config = DECISION_CONFIG[activeDecision];

    if (!reason || reason.length < 3) {
      setError('Please select or enter a reason (min 3 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.recordDecision({
        case_id: caseId,
        account_id: accountId,
        decision: activeDecision,
        reason,
        detail: detail || undefined,
        actor: 'Farah (Investigator)',
      });

      // If Generate Report — create and download a PDF of the case file
      if (activeDecision === 'generate_report' && investigation) {
        generateCasePDF(investigation, reason);
      }

      setSuccess(`${config.label} recorded — ${response.id}`);
      closeModal();

      // Auto-clear success after 4 seconds
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail?.detail || err.message
          : 'Could not record decision. Is the backend running?'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const config = activeDecision ? DECISION_CONFIG[activeDecision] : null;

  return (
    <>
      <div className="flex items-center gap-2">
        {success && (
          <Badge color="low" size="sm" className="mr-2">
            ✓ {success}
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={() => openModal('needs_review')}>
          Needs Review
        </Button>
        <Button variant="secondary" size="sm" onClick={() => openModal('close')}>
          Close
        </Button>
        <Button variant="secondary" size="sm" onClick={() => openModal('generate_report')}>
          Generate Report
        </Button>
        <Button variant="danger" size="sm" onClick={() => openModal('escalate')}>
          Escalate
        </Button>
      </div>

      {/* Decision modal */}
      {activeDecision && config && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={closeModal}
        >
          <div
            className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] w-[480px] max-w-[90vw] shadow-[var(--shadow-lg)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h3 className="text-[17px] font-bold text-[var(--ink-primary)]">{config.title}</h3>
              <p className="text-[13px] text-[var(--ink-secondary)] mt-1">
                Case <span className="font-mono">{caseId}</span> · Account <span className="font-mono">{accountId}</span>
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-2 uppercase tracking-wider">
                Reason <span className="text-[var(--risk-critical)]">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)] mb-4"
              >
                <option value="">Select a reason…</option>
                {config.reasons.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-2 uppercase tracking-wider">
                Additional detail <span className="text-[var(--ink-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                placeholder="Provide context for the compliance team…"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y mb-4"
              />

              {/* Audit preview */}
              <div className="bg-[var(--bg-inset)] rounded-[var(--radius)] px-3.5 py-2.5 text-[12px] text-[var(--ink-secondary)]">
                <strong className="text-[var(--ink-primary)]">Audit entry:</strong> Farah (Investigator) — {activeDecision.replace('_', ' ')} on {caseId} — {reason || 'reason required'} — {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
              </div>

              {error && (
                <p className="text-[13px] text-[var(--risk-critical)] mt-3">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] flex gap-2 justify-end bg-[var(--bg-canvas)]">
              <Button variant="secondary" size="md" onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant={config.variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={handleSubmit}
                disabled={submitting || reason.length < 3}
              >
                {submitting ? 'Recording…' : config.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Generate a printable case report PDF.
 * Uses the browser's native print-to-PDF via a hidden iframe.
 * This is the simplest approach that doesn't require external libraries.
 */
function generateCasePDF(investigation: InvestigateResponse, reason: string) {
  const { alert, case: caseReport, explanation } = investigation;

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  const timelineHtml = caseReport.timeline.map(t => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;">step ${t.step}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${t.event}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600;">${fmtMoney(t.amount)}</td>
    </tr>
  `).join('');

  const partiesHtml = caseReport.parties.map(p => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;font-weight:600;">${p.account_id}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize;">${p.role}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;">${fmtMoney(p.total_amount)}</td>
    </tr>
  `).join('');

  const citationsHtml = explanation.citations.map(c => `
    <div style="display:inline-block;margin:2px 4px;padding:3px 8px;background:#f0f0f0;border-radius:3px;font-size:11px;font-family:monospace;">
      <strong>${c.type}:</strong> ${c.value}
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Case Report — ${caseReport.case_id}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #0A2B5C; line-height: 1.6; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #0A2B5C; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #0A2B5C; padding-bottom: 12px; margin-bottom: 20px; }
  .meta { font-size: 11px; color: #64748B; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .badge-critical { background: #FEE2E2; color: #DC2626; }
  .badge-high { background: #FFEDD5; color: #EA580C; }
  .badge-medium { background: #FEF3C7; color: #F59E0B; }
  .narrative { font-family: Georgia, serif; font-size: 13px; line-height: 1.8; padding: 16px; background: #FFFEFA; border: 1px solid #E2E8F0; border-radius: 6px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Suspicious Activity Report</h1>
    <p class="meta">Case ID: <strong>${caseReport.case_id}</strong> · Account: <strong>${caseReport.account_id}</strong> · Alert ID: ${caseReport.alert_id}</p>
  </div>
  <div style="text-align: right;">
    <span class="badge badge-${alert.priority}">${alert.priority} priority</span>
    <p class="meta" style="margin-top:4px;">Generated: ${new Date().toLocaleString()}</p>
  </div>
</div>

<h2>Alert Summary</h2>
<table>
  <tr><td style="padding:4px 0;width:180px;"><strong>Risk Score</strong></td><td>${alert.risk_score}/100 (${alert.risk_band} band)</td></tr>
  <tr><td style="padding:4px 0;"><strong>Pattern Type</strong></td><td style="text-transform:capitalize;">${caseReport.pattern_type.replace('_', ' ')}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Priority</strong></td><td style="text-transform:capitalize;">${alert.priority}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Recommended Action</strong></td><td style="text-transform:capitalize;">${alert.recommended_action}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Total Amount Flagged</strong></td><td style="font-family:monospace;font-weight:600;">${fmtMoney(caseReport.total_amount)}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Accounts Involved</strong></td><td>${caseReport.parties.length}</td></tr>
  <tr><td style="padding:4px 0;"><strong>AI Confidence</strong></td><td>${(explanation.confidence * 100).toFixed(0)}%</td></tr>
</table>

<h2>Alert Summary Text</h2>
<p style="font-size: 13px;">${alert.summary}</p>

<h2>AI Explanation</h2>
<div class="narrative">${explanation.explanation_text}</div>
<div style="margin-top:8px;">${citationsHtml}</div>

<h2>Investigation Narrative</h2>
<div class="narrative">${caseReport.narrative}</div>

<h2>Transaction Timeline</h2>
<table>
  <thead>
    <tr style="background:#F1F4F8;">
      <th style="padding:8px;text-align:left;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Step</th>
      <th style="padding:8px;text-align:left;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Event</th>
      <th style="padding:8px;text-align:right;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Amount</th>
    </tr>
  </thead>
  <tbody>${timelineHtml}</tbody>
</table>

<h2>Parties Involved</h2>
<table>
  <thead>
    <tr style="background:#F1F4F8;">
      <th style="padding:8px;text-align:left;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Account ID</th>
      <th style="padding:8px;text-align:left;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Role</th>
      <th style="padding:8px;text-align:right;border-bottom:2px solid #0A2B5C;font-size:11px;text-transform:uppercase;">Total Amount</th>
    </tr>
  </thead>
  <tbody>${partiesHtml}</tbody>
</table>

<h2>SAR Fields</h2>
<table>
  <tr><td style="padding:4px 0;width:180px;"><strong>Filing Reason</strong></td><td>${caseReport.sar_fields?.filing_reason || 'N/A'}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Suspicious Activity Type</strong></td><td style="font-family:monospace;">${caseReport.sar_fields?.suspicious_activity_type || 'N/A'}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Reporting Institution</strong></td><td>${caseReport.sar_fields?.reporting_institution || 'N/A'}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Subject Info</strong></td><td>${caseReport.sar_fields?.subject_info || 'N/A'}</td></tr>
  <tr><td style="padding:4px 0;"><strong>Report Reason</strong></td><td>${reason}</td></tr>
</table>

<div class="footer">
  Sentinel AML — Suspicious Activity Report · Generated ${new Date().toISOString()} · Confidential
</div>

</body>
</html>
  `;

  // Open in a new window and trigger print (user can save as PDF)
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
