'use client';

import { useState } from 'react';

interface JsonViewerProps { data: unknown; label?: string; maxHeight?: string; }
export default function JsonViewer({ data, label, maxHeight = '300px' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const handleCopy = async () => { try { await navigator.clipboard.writeText(jsonStr); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  return (
    <div className="bg-[var(--bg-inset)] rounded-md border border-[var(--border-default)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">{label || 'JSON'}</span>
        <button onClick={handleCopy} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors font-mono">{copied ? '✓ COPIED' : 'COPY'}</button>
      </div>
      <pre className="p-3 overflow-auto text-[11px] font-mono leading-relaxed text-[var(--text-secondary)]" style={{ maxHeight }}>{jsonStr}</pre>
    </div>
  );
}
