/**
 * Marketing layout — wraps all public pages with PublicNav + PublicFooter.
 * The app routes (/app/*) use a separate layout with the Sidebar.
 */
import { type ReactNode } from 'react';
import PublicNav from '@/components/organisms/PublicNav';
import PublicFooter from '@/components/organisms/PublicFooter';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)]">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
