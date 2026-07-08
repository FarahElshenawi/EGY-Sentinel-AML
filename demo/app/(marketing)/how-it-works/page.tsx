/**
 * How It Works page — the 5-layer pipeline explained step by step.
 */
import Link from 'next/link';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

const steps = [
  { num: '01', title: 'Transactions flow in', desc: 'Sentinel ingests transaction data — PaySim format or your bank\'s schema. Every transaction becomes a directed edge in a graph, every account becomes a node.' },
  { num: '02', title: 'Pattern detectors scan the graph', desc: 'Three detectors run in parallel: circular flow detection (DFS cycle search), fan-out detection (smurfing), and dense cluster detection (Louvain communities). Each pattern is scored 0–1.' },
  { num: '03', title: 'Hybrid risk scoring', desc: 'A 7-rule engine (risky transaction types, balance draining, mule accounts, frequency, balance errors) combines with a trained RandomForest model. Final score: 0.5×rule + 0.5×ML, on a 0–100 scale.' },
  { num: '04', title: 'AI agents build the case', desc: 'Alert Agent classifies priority (low/medium/high/critical) and recommends an action. Case Builder assembles the timeline, parties, and SAR narrative. Explanation Agent writes a plain-English summary with citations.' },
  { num: '05', title: 'Investigator reviews and decides', desc: 'The case opens in a two-pane workspace: AI assessment and evidence on the left, graph and audit trail on the right. The investigator verifies the AI\'s claims, then escalates, closes, or files.' },
];

export default function HowItWorksPage() {
  return (
    <div className="pt-[72px]">
      <section className="py-20 border-b border-[var(--border)]">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <Badge color="orange" size="sm" className="mb-4">How It Works</Badge>
          <h1 className="text-[44px] font-bold text-[var(--brand-navy)] mb-4 tracking-tight">
            From transaction to decision in five steps
          </h1>
          <p className="text-[17px] text-[var(--ink-secondary)] max-w-[640px] mx-auto leading-relaxed">
            Every layer adds intelligence the investigator can verify. No black boxes — just evidence, explanations, and decisions.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-8 pb-12 relative">
                {/* Vertical line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-[27px] top-14 bottom-0 w-px bg-[var(--border)]" aria-hidden="true" />
                )}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-[var(--brand-navy)] text-white flex items-center justify-center font-bold tabular text-[18px] relative z-10">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-[22px] font-semibold text-[var(--brand-navy)] mb-2">{step.title}</h3>
                  <p className="text-[15px] text-[var(--ink-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <h2 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3">Ready to see it live?</h2>
          <p className="text-[15px] text-[var(--ink-secondary)] mb-6">Watch a full investigation from pattern detection to filed case.</p>
          <Link href="/contact"><Button variant="primary" size="lg">Request Demo</Button></Link>
        </div>
      </section>
    </div>
  );
}
