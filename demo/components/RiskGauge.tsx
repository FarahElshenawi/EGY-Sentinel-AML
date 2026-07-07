'use client';

interface RiskGaugeProps {
  score: number; // 0-100
  band: 'low' | 'medium' | 'high';
  size?: number;
}

const BAND_COLOR: Record<string, string> = {
  low: 'var(--risk-low)',
  medium: 'var(--risk-medium)',
  high: 'var(--risk-critical)',
};

const BAND_LABEL: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

/**
 * A semi-circular gauge that reads at a glance: color communicates the
 * risk band, the number communicates precision for anyone who wants it.
 */
export default function RiskGauge({ score, band, size = 200 }: RiskGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const strokeWidth = 14;
  const radius = size / 2 - strokeWidth;
  const circumference = Math.PI * radius; // half circle arc length
  const offset = circumference * (1 - clamped / 100);
  const color = BAND_COLOR[band] || BAND_COLOR.medium;
  const label = BAND_LABEL[band] || 'Risk Score';
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={cy + strokeWidth} viewBox={`0 0 ${size} ${cy + strokeWidth}`} role="img" aria-label={`${label}, score ${Math.round(clamped)} out of 100`}>
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
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div style={{ marginTop: -(cy * 0.55) }} className="text-center">
        <p className="tabular text-4xl font-bold leading-none" style={{ color }}>{Math.round(clamped)}</p>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mt-2">{label}</p>
      </div>
    </div>
  );
}
