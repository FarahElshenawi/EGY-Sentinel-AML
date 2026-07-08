/**
 * AnimatedHeroInvestigation — the "wow" moment.
 *
 * A self-running SVG animation that loops every ~14 seconds:
 *   Phase 1 (0-3s):   Nodes appear one by one, edges draw between them
 *   Phase 2 (3-5s):   Suspicious node turns orange, pulses
 *   Phase 3 (5-8s):   Evidence cards appear (pattern, amount, accounts)
 *   Phase 4 (8-10s):  Confidence bar fills to 85%
 *   Phase 5 (10-12s): "Case CASE-000001 ready" appears
 *   Phase 6 (12-14s): Hold, then reset
 *
 * The graph is a 4-account circular pattern (C1001→C1002→C1003→C1004→C1001)
 * matching the demo dataset. Real product behavior, visualized.
 */
'use client';

import { useEffect, useState } from 'react';

type Phase = 'building' | 'flagging' | 'evidence' | 'confidence' | 'case' | 'done';

const PHASE_TIMINGS: Record<Phase, number> = {
  building: 3000,
  flagging: 2000,
  evidence: 3000,
  confidence: 2000,
  case: 2000,
  done: 2000,
};

const NODES = [
  { id: 'C1001', x: 150, y: 50 },
  { id: 'C1002', x: 250, y: 110 },
  { id: 'C1004', x: 200, y: 180 },
  { id: 'C1003', x: 100, y: 140 },
];

const EDGES = [
  { from: 0, to: 1, amount: '$500K' },
  { from: 1, to: 2, amount: '$490K' },
  { from: 2, to: 3, amount: '$470K' },
  { from: 3, to: 0, amount: '$480K' },
];

export default function AnimatedHeroInvestigation() {
  const [phase, setPhase] = useState<Phase>('building');
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [visibleEdges, setVisibleEdges] = useState(0);

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      // Reset
      setVisibleNodes(0);
      setVisibleEdges(0);
      setPhase('building');

      // Phase 1: Build nodes + edges
      NODES.forEach((_, i) => {
        timeouts.push(setTimeout(() => setVisibleNodes(i + 1), 300 + i * 600));
      });
      EDGES.forEach((_, i) => {
        timeouts.push(setTimeout(() => setVisibleEdges(i + 1), 600 + i * 600));
      });

      // Phase 2: Flag suspicious
      timeouts.push(setTimeout(() => setPhase('flagging'), PHASE_TIMINGS.building));

      // Phase 3: Evidence
      timeouts.push(setTimeout(() => setPhase('evidence'), PHASE_TIMINGS.building + PHASE_TIMINGS.flagging));

      // Phase 4: Confidence
      timeouts.push(setTimeout(() => setPhase('confidence'), PHASE_TIMINGS.building + PHASE_TIMINGS.flagging + PHASE_TIMINGS.evidence));

      // Phase 5: Case ready
      timeouts.push(setTimeout(() => setPhase('case'), PHASE_TIMINGS.building + PHASE_TIMINGS.flagging + PHASE_TIMINGS.evidence + PHASE_TIMINGS.confidence));

      // Phase 6: Done, loop
      timeouts.push(setTimeout(() => setPhase('done'), PHASE_TIMINGS.building + PHASE_TIMINGS.flagging + PHASE_TIMINGS.evidence + PHASE_TIMINGS.confidence + PHASE_TIMINGS.case));

      // Restart
      timeouts.push(setTimeout(runCycle, PHASE_TIMINGS.building + PHASE_TIMINGS.flagging + PHASE_TIMINGS.evidence + PHASE_TIMINGS.confidence + PHASE_TIMINGS.case + PHASE_TIMINGS.done));
    };

    runCycle();
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const flagged = phase === 'flagging' || phase === 'evidence' || phase === 'confidence' || phase === 'case' || phase === 'done';
  const showEvidence = phase === 'evidence' || phase === 'confidence' || phase === 'case' || phase === 'done';
  const showConfidence = phase === 'confidence' || phase === 'case' || phase === 'done';
  const showCase = phase === 'case' || phase === 'done';

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden">
      {/* Browser bar */}
      <div className="bg-[var(--bg-inset)] px-4 py-2.5 border-b border-[var(--border)] flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">sentinel-aml.com/app/cases/C1001</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[var(--bg-canvas)] p-5 min-h-[420px] flex flex-col">
        {/* Status line */}
        <div className="flex items-center gap-2 mb-3 h-5">
          {phase === 'building' && (
            <span className="text-[11px] font-mono text-[var(--ink-muted)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-info)] animate-pulse" />
              Scanning transactions…
            </span>
          )}
          {phase === 'flagging' && (
            <span className="text-[11px] font-mono text-[var(--risk-critical)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-critical)] animate-pulse" />
              Suspicious pattern detected
            </span>
          )}
          {(showEvidence || showConfidence || showCase) && (
            <span className="text-[11px] font-mono text-[var(--ink-secondary)]">
              Account <strong className="text-[var(--ink-primary)]">C1001</strong> · Circular pattern
            </span>
          )}
        </div>

        {/* Graph + side panel */}
        <div className="flex-1 grid grid-cols-[1fr_180px] gap-4">
          {/* Graph */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] relative flex items-center justify-center">
            <svg viewBox="0 0 300 230" className="w-full h-full p-3">
              {/* Edges */}
              {EDGES.map((edge, i) => {
                const from = NODES[edge.from];
                const to = NODES[edge.to];
                const visible = i < visibleEdges;
                const isHighlighted = flagged && (edge.from === 0 || edge.to === 0);
                return (
                  <g key={i} style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms ease-out' }}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={isHighlighted ? 'var(--brand-orange)' : 'var(--border-strong)'}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray="300"
                      strokeDashoffset={visible ? 0 : 300}
                      style={{ transition: 'stroke-dashoffset 500ms ease-out, stroke 300ms' }}
                    />
                    {visible && (
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 4}
                        textAnchor="middle"
                        fontSize="8"
                        fontFamily="monospace"
                        fill={isHighlighted ? 'var(--brand-orange)' : 'var(--ink-muted)'}
                        style={{ opacity: visibleEdges > i ? 1 : 0, transition: 'opacity 300ms 300ms' }}
                      >
                        {edge.amount}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {NODES.map((node, i) => {
                const visible = i < visibleNodes;
                const isFlagged = flagged && i === 0;
                return (
                  <g key={node.id} style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms ease-out' }}>
                    {isFlagged && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        fill="none"
                        stroke="var(--brand-orange)"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                        opacity="0.6"
                      >
                        <animate attributeName="r" values="18;24;18" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isFlagged ? 14 : 12}
                      fill={isFlagged ? 'var(--brand-orange)' : 'white'}
                      stroke={isFlagged ? 'var(--brand-navy)' : 'var(--brand-navy)'}
                      strokeWidth="2"
                      style={{ transition: 'r 300ms, fill 300ms' }}
                    />
                    <text
                      x={node.x}
                      y={node.y + 3}
                      textAnchor="middle"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="700"
                      fill={isFlagged ? 'var(--brand-navy)' : 'var(--brand-navy)'}
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side panel — evidence assembles */}
          <div className="flex flex-col gap-2">
            {showEvidence && (
              <>
                <div
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] p-2.5"
                  style={{ animation: 'fadeInUp 300ms ease-out' }}
                >
                  <p className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Pattern</p>
                  <p className="text-[12px] font-semibold text-[var(--risk-high)]">Circular</p>
                </div>
                <div
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] p-2.5"
                  style={{ animation: 'fadeInUp 300ms ease-out 100ms' }}
                >
                  <p className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Amount</p>
                  <p className="text-[14px] font-bold tabular text-[var(--ink-primary)]">$970K</p>
                </div>
                <div
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] p-2.5"
                  style={{ animation: 'fadeInUp 300ms ease-out 200ms' }}
                >
                  <p className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">Accounts</p>
                  <p className="text-[14px] font-bold tabular text-[var(--ink-primary)]">4</p>
                </div>
              </>
            )}

            {showConfidence && (
              <div
                className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] p-2.5"
                style={{ animation: 'fadeInUp 300ms ease-out' }}
              >
                <p className="text-[8px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold mb-1.5">AI confidence</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--risk-low)] rounded-full"
                      style={{ width: '85%', transition: 'width 1s ease-out' }}
                    />
                  </div>
                  <span className="text-[10px] tabular font-bold text-[var(--risk-low)]">85%</span>
                </div>
              </div>
            )}

            {showCase && (
              <div
                className="bg-[var(--brand-navy)] text-white rounded-[var(--radius)] p-3 mt-auto"
                style={{ animation: 'fadeInUp 400ms ease-out' }}
              >
                <p className="text-[8px] uppercase tracking-wider text-white/50 font-semibold mb-1">Case ready</p>
                <p className="text-[13px] font-bold font-mono">CASE-000001</p>
                <p className="text-[9px] text-white/70 mt-1">Critical priority · Freeze recommended</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
