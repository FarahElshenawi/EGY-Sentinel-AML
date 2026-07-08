/**
 * Spinner — atomic loading indicator.
 * Used inline in buttons and as standalone loading state.
 */
'use client';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 16, className = '' }: SpinnerProps) {
  return (
    <span
      className={`spinner ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
