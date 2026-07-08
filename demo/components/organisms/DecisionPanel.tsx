/**
 * DecisionPanel — the escalate / close / review / report actions.
 *
 * WIRED: Each button opens a modal requiring a reason, then calls the
 * real /api/v1/cases/decide endpoint. Decisions are logged to the
 * audit trail with timestamp and actor.
 */
'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { api, ApiError, type DecisionType } from '@/lib/api';
import Badge from '@/components/atoms/Badge';

interface DecisionPanelProps {
  caseId: string;
  accountId: string;
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

export default function DecisionPanel({ caseId, accountId }: DecisionPanelProps) {
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
