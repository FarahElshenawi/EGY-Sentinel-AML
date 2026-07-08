/**
 * RiskDot — atomic colored dot indicating risk band.
 *
 * UX decision: color on the indicator only, never as background fill
 * (audit pain point #1 — color noise causes alert fatigue).
 * The dot uses a soft halo so it reads as a status indicator, not a light.
 */
'use client';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface RiskDotProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

const colorMap: Record<RiskLevel, string> = {
  critical: 'var(--risk-critical)',
  high: 'var(--risk-high)',
  medium: 'var(--risk-medium)',
  low: 'var(--risk-low)',
  info: 'var(--risk-info)',
};

const haloMap: Record<RiskLevel, string> = {
  critical: 'rgba(220, 38, 38, 0.15)',
  high: 'rgba(234, 88, 12, 0.15)',
  medium: 'rgba(245, 158, 11, 0.15)',
  low: 'rgba(22, 163, 74, 0.15)',
  info: 'rgba(14, 165, 233, 0.15)',
};

export default function RiskDot({ level, size = 'md' }: RiskDotProps) {
  const px = size === 'sm' ? 8 : 10;
  const haloPx = size === 'sm' ? 16 : 20;
  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{ width: haloPx, height: haloPx }}
      role="img"
      aria-label={`${level} risk`}
    >
      <span
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: colorMap[level],
          boxShadow: `0 0 0 3px ${haloMap[level]}`,
        }}
      />
    </span>
  );
}
