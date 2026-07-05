'use client';

import KpiTile from './KpiTile';

export default function KpiStrip() {
  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n}`;
  };

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      <KpiTile
        label="Critical Alerts"
        value={1}
        delta={1}
        deltaSuffix=" new"
        trend="up"
        trendIsGood="down"
        spark={[0, 0, 1, 0, 2, 1, 1]}
        accent="critical"
        icon="🔴"
      />
      <KpiTile
        label="Amount Flagged"
        value={fmtMoney(1_740_000)}
        delta={12}
        deltaSuffix="%"
        trend="up"
        trendIsGood="down"
        spark={[0.8, 1.2, 0.9, 1.5, 1.1, 1.7, 1.74]}
        accent="warning"
        icon="💰"
      />
      <KpiTile
        label="Precision · 7d"
        value={`${(0.87 * 100).toFixed(0)}`}
        unit="%"
        delta={2}
        deltaSuffix="%"
        trend="up"
        trendIsGood="up"
        spark={[0.82, 0.84, 0.85, 0.86, 0.85, 0.87, 0.87]}
        accent="success"
        icon="🎯"
      />
      <KpiTile
        label="Model Drift"
        value={(0.04).toFixed(2)}
        delta={-0.01}
        trend="down"
        trendIsGood="down"
        spark={[0.03, 0.04, 0.05, 0.04, 0.05, 0.04, 0.04]}
        accent="info"
        icon="📊"
      />
      <KpiTile
        label="Throughput"
        value="1,204"
        unit="txn/s"
        delta={8}
        deltaSuffix="%"
        trend="up"
        trendIsGood="up"
        spark={[980, 1050, 1100, 1150, 1180, 1200, 1204]}
        accent="default"
        icon="⚡"
      />
    </div>
  );
}
