/**
 * Sidebar — left navigation rail.
 *
 * UX decision (audit): 5 destinations max, not 12. Icons + hover labels
 * (icons alone aren't enough for a compliance tool). Active state is
 * the orange accent from the logo.
 *
 * Destinations: Queue, Graph Explorer, Reports, Settings.
 * (Login is public; the workspace is reached via the queue.)
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}

const items: NavItem[] = [
  {
    name: 'Queue',
    href: '/app/queue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    match: (p) => p === '/app/queue' || p.startsWith('/app/cases'),
  },
  {
    name: 'Graph Explorer',
    href: '/app/graph',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" />
        <line x1="12" y1="7" x2="19" y2="17" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    ),
    match: (p) => p === '/app/graph',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    match: (p) => p === '/app/reports',
  },
  {
    name: 'Settings',
    href: '/app/settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    match: (p) => p === '/app/settings',
  },
];

export default function Sidebar() {
  const pathname = usePathname() || '';

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-[var(--brand-navy)] flex flex-col items-center py-4 z-50"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <Link href="/app/queue" className="mb-6 block" aria-label="Sentinel home">
        <Logo size={28} />
      </Link>

      <nav className="flex flex-col gap-1.5 flex-1" role="navigation" aria-label="Main">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center justify-center rounded-[var(--radius-md)] transition-colors duration-[var(--transition)] ${
                active ? 'bg-[var(--brand-orange)] text-[var(--brand-navy)]' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
              style={{ width: 40, height: 40 }}
              title={item.name}
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ width: 20, height: 20 }}>{item.icon}</span>
              {active && (
                <span
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[var(--brand-orange)] rounded-r-full"
                  aria-hidden="true"
                />
              )}
              <span
                className="pointer-events-none absolute left-[52px] whitespace-nowrap rounded-[var(--radius)] bg-[var(--brand-navy-hover)] border border-white/10 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className="flex items-center justify-center rounded-full bg-[var(--brand-orange)] text-[var(--brand-navy)] font-bold text-sm"
        style={{ width: 36, height: 36 }}
        title="Farah (Investigator)"
        role="img"
        aria-label="Farah, Investigator"
      >
        F
      </div>
    </aside>
  );
}
