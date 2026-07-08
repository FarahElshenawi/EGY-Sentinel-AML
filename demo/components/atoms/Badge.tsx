/**
 * Badge — atomic label for risk bands, pattern types, statuses.
 *
 * UX decision: color encodes meaning only, never decoration.
 * Three sizes (xs/sm/md), five semantic colors.
 * Used on case rows, in workspace headers, on timeline events.
 */
'use client';

import { type ReactNode } from 'react';

type BadgeColor = 'navy' | 'orange' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'muted';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  uppercase?: boolean;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  navy: 'bg-[var(--brand-navy-subtle)] text-[var(--brand-navy)]',
  orange: 'bg-[var(--brand-orange-soft)] text-[var(--risk-high)]',
  critical: 'bg-risk-critical-soft',
  high: 'bg-risk-high-soft',
  medium: 'bg-risk-medium-soft',
  low: 'bg-risk-low-soft',
  info: 'bg-risk-info-soft',
  muted: 'bg-[var(--bg-inset)] text-[var(--ink-secondary)]',
};

const sizeMap: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded',
  sm: 'text-[11px] px-2 py-0.5 rounded',
  md: 'text-xs px-2.5 py-1 rounded',
};

export default function Badge({
  children,
  color = 'muted',
  size = 'sm',
  uppercase = true,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-wide ${colorMap[color]} ${sizeMap[size]} ${uppercase ? 'uppercase' : ''} ${className}`}
      style={{ letterSpacing: uppercase ? '0.04em' : 'normal' }}
    >
      {children}
    </span>
  );
}
