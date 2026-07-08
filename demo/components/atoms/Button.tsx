/**
 * Button — atomic action trigger.
 *
 * UX decision: persistent decision panel requires 4 variants
 * that visually communicate consequence.
 *  - primary: navy, the main action
 *  - danger: red, destructive (escalate)
 *  - secondary: white with border, neutral
 *  - ghost: no border, contextual
 *
 * Sizes: sm (32px), md (36px), lg (42px). All keyboard-accessible.
 */
'use client';

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';

type Variant = 'primary' | 'danger' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  icon?: ReactNode;
}

const variantMap: Record<Variant, string> = {
  primary: 'bg-[var(--brand-navy)] text-white border-transparent hover:bg-[var(--brand-navy-hover)]',
  danger: 'bg-[var(--risk-critical)] text-white border-transparent hover:bg-[#B91C1C]',
  secondary: 'bg-[var(--bg-surface)] text-[var(--ink-primary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]',
  ghost: 'bg-transparent text-[var(--ink-secondary)] border-transparent hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)]',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-[15px] gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', children, icon, className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium rounded-[var(--radius)] border transition-colors duration-[var(--transition)] disabled:opacity-50 disabled:cursor-not-allowed ${variantMap[variant]} ${sizeMap[size]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

export default Button;
