'use client';

import { useState } from 'react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  action: string;
  entity: string;
  consequences: string[];
}

export default function ConfirmModal({ open, onClose, onConfirm, title, action, entity, consequences }: ConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [showAuditPreview, setShowAuditPreview] = useState(false);
  if (!open) return null;

  const timestamp = new Date().toISOString();
  const user = 'farah@egy-sentinel';
  const hash = 'a3f7b2c1' + Math.random().toString(16).slice(2, 6);
  const canConfirm = reason.trim().length >= 10;

  const handleConfirm = () => { if (!canConfirm) return; onConfirm(reason.trim()); setReason(''); setShowAuditPreview(false); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canConfirm) { handleConfirm(); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(11, 18, 32, 0.6)' }} onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="bg-[var(--bg-surface)] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border-strong)]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-3" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
          <span className="text-xl">⚠</span>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Entity: <span className="font-mono">{entity}</span></p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">This action will:</p>
            <ul className="space-y-1.5">
              {consequences.map((c, i) => (<li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]"><span className="text-[var(--risk-medium)] flex-shrink-0 mt-0.5">•</span><span>{c}</span></li>))}
            </ul>
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5 block">
              Reason <span className="text-[var(--risk-critical)]">*</span>
              <span className="text-[var(--text-muted)] normal-case font-normal ml-1">(min 10 chars, required for audit log)</span>
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Confirmed circular pattern with 4 accounts, escalating for compliance review." rows={3} className="w-full px-3 py-2 text-sm border border-[var(--border-strong)] rounded-md focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] resize-none bg-[var(--bg-app)] text-[var(--text-primary)]" autoFocus />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[var(--text-muted)]">{reason.trim().length < 10 ? `${10 - reason.trim().length} more chars needed` : '✓ Valid reason'}</span>
              <span className="text-[10px] text-[var(--text-muted)] tabular">{reason.length}/500</span>
            </div>
          </div>
          <div>
            <button onClick={() => setShowAuditPreview(!showAuditPreview)} className="text-[10px] text-[var(--brand-primary)] hover:underline font-semibold uppercase tracking-wider">{showAuditPreview ? '▼ Hide' : '▸ Show'} Audit Preview</button>
            {showAuditPreview && (
              <div className="mt-2 bg-[var(--bg-inset)] rounded-md p-3 border border-[var(--border-default)]">
                <pre className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto">{`{
  "user": "${user}",
  "action": "${action}",
  "entity": "${entity}",
  "reason": "${reason || '<your reason here>'}",
  "timestamp": "${timestamp}",
  "session_id": "sess-a3f7b2c1",
  "hash": "${hash}...",
  "immutable": true
}`}</pre>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-4 bg-[var(--bg-subtle)] border-t border-[var(--border-default)] flex items-center justify-between">
          <p className="text-[10px] text-[var(--text-muted)]">
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-[9px] font-mono">Esc</kbd> to cancel ·{' '}
            <kbd className="px-1.5 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-[9px] font-mono">⌘+↵</kbd> to confirm
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
            <button onClick={handleConfirm} disabled={!canConfirm} className="px-4 py-1.5 text-xs font-semibold text-white rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: canConfirm ? 'var(--risk-high)' : 'var(--text-muted)' }}>{title.split(' ')[0]} & Log</button>
          </div>
        </div>
      </div>
    </div>
  );
}
