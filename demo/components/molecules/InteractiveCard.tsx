/**
 * InteractiveCard — hover-lift card with soft shadow and orange top accent.
 *
 * UX decision: 200ms transition. Lift 4px on hover. Soft shadow appears.
 * Orange top border glows. Used for Detect/Explain/Decide and capability cards.
 */
'use client';

import { type ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean; // show orange top border
}

export default function InteractiveCard({ children, className = '', accent = false }: InteractiveCardProps) {
  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] ${accent ? 'border-t-[3px] border-t-[var(--brand-orange)] hover:border-t-[var(--brand-orange)]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
