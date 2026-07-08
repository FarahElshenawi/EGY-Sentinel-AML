/**
 * TopBar — page title + global search.
 *
 * UX decision: search is global (account ID lookup from any page).
 * Title is contextual (changes per page). No breadcrumb here —
 * breadcrumbs live in the workspace header where context matters more.
 */
'use client';

import { type ReactNode } from 'react';
import SearchInput from '@/components/molecules/SearchInput';

interface TopBarProps {
  title: string;
  children?: ReactNode;
}

export default function TopBar({ title, children }: TopBarProps) {
  return (
    <header
      className="flex items-center gap-4 px-6 bg-[var(--bg-surface)] border-b border-[var(--border)]"
      style={{ height: 'var(--topbar-height)' }}
    >
      <h1 className="text-[15px] font-semibold text-[var(--ink-primary)]">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {children}
        <SearchInput placeholder="Search account ID…" />
      </div>
    </header>
  );
}
