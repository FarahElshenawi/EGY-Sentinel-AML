'use client';

import type { ReactNode } from 'react';

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaSuffix?: string;
  trend?: 'up' | 'down' | 'flat';
  trendIsGood?: 'up' | 'down' | 'neutral';
  spark?: number[];
  accent?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  icon?: ReactNode;
}

const accentColors = {
  default: 'var(--text-primary)',
  critical: 'var(--risk-critical)',
  warning: 'var(--risk-medium)',
  success: 'var(--risk-low)',
  info: 'var(--risk-info)',
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 20;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export default function KpiTile({
  label, value, unit, delta, deltaSuffix = '', trend = 'flat', trendIsGood = 'neutral', spark, accent = 'default', icon,
}: KpiTileProps) {
  const valueColor = accentColors[accent];
  let deltaColor = 'var(--text-muted)';
  let deltaArrow = '→';
  if (trend === 'up') {
    deltaArrow = '▲';
    deltaColor = trendIsGood === 'up' ? 'var(--risk-low)' : trendIsGood === 'down' ? 'var(--risk-critical)' : 'var(--text-muted)';
  } else if (trend === 'down') {
    deltaArrow = '▼';
    deltaColor = trendIsGood === 'down' ? 'var(--risk-low)' : trendIsGood === 'up' ? 'var(--risk-critical)' : 'var(--text-muted)';
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: accent !== 'default' ? valueColor : 'var(--border-strong)' }} />
      <div className="flex items-center justify-between">
        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold leading-tight">{label}</p>
        {icon && <span className="text-xs opacity-50">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="tabular-lg text-2xl leading-none" style={{ color: valueColor }}>{value}</span>
        {unit && <span className="text-xs text-[var(--text-muted)] font-medium">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-auto">
        {delta !== undefined && (
          <span className="text-[10px] font-medium tabular flex items-center gap-0.5" style={{ color: deltaColor }}>
            <span className="text-[8px]">{deltaArrow}</span>{Math.abs(delta)}{deltaSuffix}
          </span>
        )}
        {spark && spark.length > 1 && <Sparkline data={spark} color={valueColor} />}
      </div>
    </div>
  );
}
