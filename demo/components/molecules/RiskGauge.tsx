/**
 * RiskGauge — semicircle SVG gauge showing risk score 0-100.
 *
 * UX decision: color communicates band, number communicates precision.
 * The gauge reads at a glance — investigator sees "85 high" without
 * parsing. Semicircle (not full circle) because it implies a scale
 * with a clear ceiling.
 */
'use client';

type RiskBand = 'low' | 'medium' | 'high';

interface RiskGaugeProps {
  score: number;        // 0-100
  band: RiskBand;
  size?: number;        // pixel width
}

const bandColor: Record<RiskBand, string> = {
  low: 'var(--risk-low)',
  medium: 'var(--risk-medium)',
  high: 'var(--risk-critical)',
};

const bandLabel: Record<RiskBand, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

export default function RiskGauge({ score, band, size = 180 }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeWidth = 12;
  const radius = size / 2 - strokeWidth;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = bandColor[band];
  const label = bandLabel[band];
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg
        width={size}
        height={cy + strokeWidth}
        viewBox={`0 0 ${size} ${cy + strokeWidth}`}
        role="img"
        aria-label={`${label}, score ${Math.round(clamped)} out of 100`}
      >
        <path
          d={`M ${strokeWidth} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke="var(--bg-inset)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div style={{ marginTop: -(cy * 0.55) }} className="text-center">
        <p className="tabular text-4xl font-bold leading-none" style={{ color }}>
          {Math.round(clamped)}
        </p>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mt-2">
          {label}
        </p>
      </div>
    </div>
  );
}
