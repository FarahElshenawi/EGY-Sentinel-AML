/**
 * Product page — deep dive into the platform capabilities.
 */
import Link from 'next/link';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

const capabilities = [
  { title: 'Pattern Detection', desc: 'Three detectors scan every transaction graph for the signatures that matter: circular flows (layering), fan-out (smurfing), and dense clusters (coordinated activity).', tech: 'NetworkX · simple_cycles · Louvain' },
  { title: 'Hybrid Risk Scoring', desc: 'A transparent 7-rule engine combines with a trained RandomForest model. Every score is auditable — regulators can see exactly which rules fired.', tech: 'scikit-learn · 0.5×rule + 0.5×ML' },
  { title: 'Agentic AI Pipeline', desc: 'Three AI agents build the investigation: Alert Agent classifies priority, Case Builder assembles the SAR, Explanation Agent writes the plain-English summary with citations.', tech: 'OpenRouter · Qwen3 Next 80B' },
  { title: 'Investigation Workspace', desc: 'A two-pane workspace built around human reasoning: AI assessment on the left, graph and audit on the right. Decisions in the header, not buried in menus.', tech: 'Next.js 16 · React 19' },
  { title: 'Graph Explorer', desc: 'A full-screen transaction network for discovery. Filter by pattern type, click any node for account details, open a case in one click.', tech: 'react-force-graph-2d' },
  { title: 'Compliance Reports', desc: 'Every case generates a SAR-ready report: timeline, parties, narrative, and filing fields. Export for regulatory submission.', tech: 'Schema-validated · PDF-ready' },
];

export default function ProductPage() {
  return (
    <div className="pt-[72px]">
      {/* Hero */}
      <section className="py-20 border-b border-[var(--border)]">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <Badge color="orange" size="sm" className="mb-4">Product</Badge>
          <h1 className="text-[44px] font-bold text-[var(--brand-navy)] mb-4 tracking-tight">
            One platform, five layers of intelligence
          </h1>
          <p className="text-[17px] text-[var(--ink-secondary)] max-w-[640px] mx-auto leading-relaxed">
            Sentinel combines graph analysis, machine learning, and agentic AI into a single investigation pipeline — from raw transaction to filed case.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.title} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-7">
                <h3 className="text-[20px] font-semibold text-[var(--brand-navy)] mb-2">{cap.title}</h3>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed mb-4">{cap.desc}</p>
                <span className="inline-block text-[11px] font-mono text-[var(--ink-muted)] bg-[var(--bg-inset)] px-2.5 py-1 rounded">
                  {cap.tech}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <h2 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3">Want to see it in action?</h2>
          <p className="text-[15px] text-[var(--ink-secondary)] mb-6">Request a demo and we&apos;ll walk you through a real investigation.</p>
          <Link href="/contact"><Button variant="primary" size="lg">Request Demo</Button></Link>
        </div>
      </section>
    </div>
  );
}
