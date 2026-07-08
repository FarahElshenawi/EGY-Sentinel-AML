/**
 * AppShell — the persistent application frame: sidebar + topbar + content.
 *
 * UX decision: every authenticated page uses this shell so the
 * investigator never loses their place. The sidebar is fixed; the
 * content scrolls independently.
 */
'use client';

import { type ReactNode } from 'react';
import Sidebar from '@/components/organisms/Sidebar';
import TopBar from '@/components/organisms/TopBar';

interface AppShellProps {
  title: string;
  children: ReactNode;
  topBarExtras?: ReactNode;
}

export default function AppShell({ title, children, topBarExtras }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)' }}>
        <TopBar title={title}>{topBarExtras}</TopBar>
        <main>{children}</main>
      </div>
    </div>
  );
}
