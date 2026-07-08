/**
 * PublicFooter — marketing site footer.
 */
'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

const footerLinks = {
  Product: [
    { name: 'Overview', href: '/product' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Security & Explainability', href: '/security' },
    { name: 'Request Demo', href: '/contact' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Log in', href: '/login' },
  ],
  Legal: [
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
    { name: 'Compliance', href: '/security' },
  ],
};

export default function PublicFooter() {
  return (
    <footer className="bg-[var(--brand-navy)] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-14">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-12">
          {/* Brand column */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="text-[17px] font-bold tracking-tight">Sentinel</span>
            </Link>
            <p className="text-[13px] text-white/60 leading-relaxed max-w-[260px]">
              Explainable AI for anti-money laundering investigation. Transform suspicious activity into investigation-ready cases.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-4">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-[13px] text-white/80 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex items-center justify-between">
          <p className="text-[12px] text-white/40">© 2026 Sentinel AML. Built for bank investigators.</p>
          <p className="text-[12px] text-white/40">Academic Capstone Project</p>
        </div>
      </div>
    </footer>
  );
}
