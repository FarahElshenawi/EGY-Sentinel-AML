/**
 * SearchInput — input with keyboard hint.
 *
 * UX decision: '/' focuses search (power-user feature for investigators
 * who work cases all day). The kbd hint is always visible.
 */
'use client';

import { useEffect, useRef, type InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  onSlashFocus?: boolean;
}

export default function SearchInput({ onSlashFocus = true, ...props }: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!onSlashFocus) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSlashFocus]);

  return (
    <div className="flex items-center gap-2 bg-[var(--bg-inset)] border border-[var(--border)] rounded-[var(--radius)] px-3 py-1.5 w-[280px] focus-within:border-[var(--border-focus)] focus-within:bg-[var(--bg-surface)] transition-colors">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={ref}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
        {...props}
      />
      <kbd className="font-mono text-[10px] bg-[var(--bg-surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--ink-muted)] flex-shrink-0">
        /
      </kbd>
    </div>
  );
}
