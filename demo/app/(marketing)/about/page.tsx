/**
 * About page.
 */
import Link from 'next/link';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

export default function AboutPage() {
  return (
    <div className="pt-[72px]">
      <section className="py-20 border-b border-[var(--border)]">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <Badge color="orange" size="sm" className="mb-4">About</Badge>
          <h1 className="text-[44px] font-bold text-[var(--brand-navy)] mb-4 tracking-tight">
            Built by investigators, for investigators
          </h1>
          <p className="text-[17px] text-[var(--ink-secondary)] max-w-[600px] mx-auto leading-relaxed">
            Sentinel was built as a capstone project to solve a real problem: AML investigators drown in false positives and spend hours building case files by hand. We think AI can do better — without becoming a black box.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="text-center">
              <p className="text-[40px] font-bold text-[var(--brand-navy)] tabular-lg mb-1">7</p>
              <p className="text-[13px] text-[var(--ink-secondary)]">Team members</p>
            </div>
            <div className="text-center">
              <p className="text-[40px] font-bold text-[var(--brand-navy)] tabular-lg mb-1">5</p>
              <p className="text-[13px] text-[var(--ink-secondary)]">Pipeline layers</p>
            </div>
            <div className="text-center">
              <p className="text-[40px] font-bold text-[var(--brand-navy)] tabular-lg mb-1">231</p>
              <p className="text-[13px] text-[var(--ink-secondary)]">Tests passing</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-[24px] font-bold text-[var(--brand-navy)] mb-4">Our principles</h2>
            <div className="space-y-4 text-[15px] text-[var(--ink-secondary)] leading-relaxed">
              <p><strong className="text-[var(--brand-navy)]">Evidence first.</strong> Every AI output includes the evidence behind it. Investigators verify, then decide — they don&apos;t just trust.</p>
              <p><strong className="text-[var(--brand-navy)]">Calm, not flashy.</strong> Sentinel looks like a document tool, not a hacker movie. Investigators read it for 8 hours a day; the interface respects that.</p>
              <p><strong className="text-[var(--brand-navy)]">Decisions, not dashboards.</strong> The homepage is the queue, not a chart. Every screen answers &quot;what should I do next?&quot;</p>
              <p><strong className="text-[var(--brand-navy)]">Open and auditable.</strong> The rule engine is documented. The schemas are locked. The audit trail is complete. Regulators get what they need.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[600px] mx-auto px-6 text-center">
          <h2 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3">Want to learn more?</h2>
          <p className="text-[15px] text-[var(--ink-secondary)] mb-6">Get in touch — we&apos;ll walk you through the platform.</p>
          <Link href="/contact"><Button variant="primary" size="lg">Contact us</Button></Link>
        </div>
      </section>
    </div>
  );
}
