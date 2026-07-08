/**
 * Security & Explainability page.
 */
import Link from 'next/link';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

const principles = [
  { title: 'Every claim has a source', desc: 'The AI explanation includes citation chips linking each factual claim to the specific transaction, pattern, or score that supports it. Investigators verify in one click.' },
  { title: 'Confidence on every assessment', desc: 'Every AI-generated explanation carries a confidence score (0–100%). Investigators know how much to trust the assessment before acting.' },
  { title: 'Full agent reasoning chain', desc: 'The audit pane shows the complete AI pipeline: Alert Agent output, Case Builder output, Explanation Agent output — timestamped and logged.' },
  { title: 'Schema-validated responses', desc: 'Every API response is validated against locked JSON schemas. The alert, case, and explanation schemas are versioned contracts — no silent drift.' },
  { title: 'Transparent rule engine', desc: 'The 7 risk rules are documented and auditable. Regulators can see exactly which rules fired on any given transaction. No black-box scoring.' },
  { title: 'Human in the loop', desc: 'Sentinel builds the case. Your investigator makes the decision. Escalate, close, or file — always with a required reason, always logged.' },
];

export default function SecurityPage() {
  return (
    <div className="pt-[72px]">
      <section className="py-20 border-b border-[var(--border)]">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <Badge color="orange" size="sm" className="mb-4">Security & Explainability</Badge>
          <h1 className="text-[44px] font-bold text-[var(--brand-navy)] mb-4 tracking-tight">
            Built for scrutiny, designed for trust
          </h1>
          <p className="text-[17px] text-[var(--ink-secondary)] max-w-[640px] mx-auto leading-relaxed">
            AML investigators don&apos;t need a magic box. They need evidence they can verify and an audit trail they can hand to regulators. Sentinel is built around both.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="grid grid-cols-2 gap-6">
            {principles.map((p) => (
              <div key={p.title} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-7 border-l-[3px] border-l-[var(--brand-orange)]">
                <h3 className="text-[18px] font-semibold text-[var(--brand-navy)] mb-2">{p.title}</h3>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <h2 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3">Audit-ready out of the box</h2>
          <p className="text-[15px] text-[var(--ink-secondary)] mb-6">See how Sentinel handles a real compliance review.</p>
          <Link href="/contact"><Button variant="primary" size="lg">Request Demo</Button></Link>
        </div>
      </section>
    </div>
  );
}
