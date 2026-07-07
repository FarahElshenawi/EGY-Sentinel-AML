'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const IconAlerts = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconCases = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
}

/**
 * Primary navigation, intentionally limited to three destinations so
 * investigators always know where they are: an overview of everything
 * happening, an inbox of things that need attention, and the workspace
 * where an individual case gets worked.
 */
export default function Sidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <IconDashboard />, active: pathname === '/dashboard' },
    { name: 'Alerts', href: '/alerts', icon: <IconAlerts />, active: pathname === '/alerts' },
    { name: 'Cases', href: '/cases', icon: <IconCases />, active: pathname?.startsWith('/cases') ?? false },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[64px] bg-[#060B14] border-r border-[var(--border-default)] flex flex-col items-center py-5 z-50">
      <Link href="/" className="mb-8 block">
        <Logo size={32} />
      </Link>

      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all relative group ${
              item.active
                ? 'bg-[var(--brand-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
            }`}
            title={item.name}
          >
            {item.icon}
            {item.active && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent)] rounded-r-full" />
            )}
            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-md bg-[var(--bg-inset)] border border-[var(--border-default)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      <div
        className="w-9 h-9 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center text-[var(--text-primary)] font-bold text-sm border border-[var(--border-default)]"
        title="Farah (Investigator)"
      >
        F
      </div>
    </aside>
  );
}
