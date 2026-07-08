/**
 * JsonViewer — collapsible JSON display for the audit pane.
 * Used to show the raw investigation response to compliance officers.
 */
'use client';

import { useState } from 'react';

interface JsonViewerProps {
  data: unknown;
  label?: string;
  maxHeight?: string;
}

export default function JsonViewer({ data, label = 'JSON', maxHeight = '300px' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="bg-[var(--bg-inset)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider font-semibold">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-[var(--ink-muted)] hover:text-[var(--brand-navy)] transition-colors font-mono font-semibold"
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>
      <pre
        className="p-3 overflow-auto text-[11px] font-mono leading-relaxed text-[var(--ink-secondary)]"
        style={{ maxHeight }}
      >
        {jsonStr}
      </pre>
    </div>
  );
}
