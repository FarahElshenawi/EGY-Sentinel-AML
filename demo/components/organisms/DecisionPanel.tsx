/**
 * DecisionPanel — the escalate / close / review / report actions.
 *
 * UX decision (audit pain point #5): the decision is the point of the
 * investigation. It must never be more than one click away. This panel
 * is persistent in the workspace header.
 *
 * Actions:
 *  - Escalate (danger) — opens confirmation modal with required reason
 *  - Close (secondary) — closes as false positive, requires reason
 *  - Needs Review (ghost) — sends back to queue for another investigator
 *  - Generate Report (secondary) — exports SAR-ready PDF
 */
'use client';

import Button from '@/components/atoms/Button';

interface DecisionPanelProps {
  onEscalate?: () => void;
  onClose?: () => void;
  onNeedsReview?: () => void;
  onGenerateReport?: () => void;
}

export default function DecisionPanel({
  onEscalate,
  onClose,
  onNeedsReview,
  onGenerateReport,
}: DecisionPanelProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={onNeedsReview}>
        Needs Review
      </Button>
      <Button variant="secondary" size="sm" onClick={onClose}>
        Close
      </Button>
      <Button variant="secondary" size="sm" onClick={onGenerateReport}>
        Generate Report
      </Button>
      <Button variant="danger" size="sm" onClick={onEscalate}>
        Escalate
      </Button>
    </div>
  );
}
