/**
 * PublicNav — marketing site navigation bar.
 *
 * UX decision: transparent over hero, solid on scroll. Logo + 5 nav
 * links + Login + Request Demo CTA. Same navy/orange design system.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import Button from '@/components/atoms/Button';

const navLinks = [
  { name: 'Product', href: '/product' },
  { name: 'How It Works', href: '/how-it-works' },
  { name: 'Security', href: '/security' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function PublicNav() {
  const pathname = usePathname() || '';

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sentinel home">
          <Logo size={32} />
          <span className="text-[17px] font-bold tracking-tight text-[var(--brand-navy)]">Sentinel</span>
        </Link>

        <nav className="flex items-center gap-1" role="navigation" aria-label="Marketing">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-[14px] font-medium rounded-[var(--radius)] transition-colors ${
                  active
                    ? 'text-[var(--brand-navy)] bg-[var(--brand-navy-subtle)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--brand-navy)] hover:bg-[var(--bg-inset)]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/contact">
            <Button variant="primary" size="sm">Request Demo</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
