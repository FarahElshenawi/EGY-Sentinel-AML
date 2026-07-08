/**
 * Landing page — the public homepage.
 *
 * Sections (top to bottom):
 * 1. Hero — promise + CTA + LIVE animated investigation demo (the "wow" moment)
 * 2. Problem — animated stats with count-up
 * 3. Solution — 3 interactive cards (Detect / Explain / Decide)
 * 4. How It Works — vertical pipeline with connected steps
 * 5. Interactive Preview — full-width workspace mockup
 * 6. Explainable AI — alternating layout (text | visual)
 * 7. Enterprise Security — 3 cards
 * 8. Benefits — 2×2 metrics grid
 * 9. CTA — final conversion
 */
import Link from 'next/link';
import Logo from '@/components/Logo';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import ScrollReveal from '@/components/atoms/ScrollReveal';
import AnimatedCounter from '@/components/molecules/AnimatedCounter';
import InteractiveCard from '@/components/molecules/InteractiveCard';
import AnimatedHeroInvestigation from '@/components/organisms/AnimatedHeroInvestigation';

export default function LandingPage() {
  return (
    <>
      {/* ═══ 1. HERO ═══ */}
      <section className="relative pt-[72px] overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 -z-10" aria-hidden="true" style={{
          background: 'linear-gradient(180deg, var(--bg-canvas) 0%, var(--bg-inset) 100%)',
        }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 opacity-[0.025]" aria-hidden="true">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--brand-navy)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-20">
          <div className="grid grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 mb-5">
                  <Badge color="orange" size="sm">Explainable AI for AML</Badge>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <h1 className="text-[48px] leading-[1.08] font-bold tracking-tight text-[var(--brand-navy)] mb-5">
                  Transform suspicious activity into{' '}
                  <span style={{ color: 'var(--brand-orange)' }}>investigation-ready cases</span>
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <p className="text-[17px] leading-[1.6] text-[var(--ink-secondary)] mb-8 max-w-[480px]">
                  Sentinel detects money-laundering patterns, explains why each account was flagged, and hands your investigators a complete case file — in minutes, not days.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={300}>
                <div className="flex items-center gap-3 mb-8">
                  <Link href="/contact">
                    <Button variant="primary" size="lg" className="shadow-[0_4px_14px_rgba(10,43,92,0.25)] hover:shadow-[0_6px_20px_rgba(10,43,92,0.35)] hover:-translate-y-0.5">
                      Request Demo →
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="secondary" size="lg">See how it works</Button>
                  </Link>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={400}>
                <div className="flex items-center gap-6 text-[12px] text-[var(--ink-muted)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-low)]" />3 pattern detectors
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-low)]" />AI citations on every claim
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-low)]" />Full audit trail
                  </span>
                </div>
              </ScrollReveal>
            </div>

            {/* Right — animated investigation */}
            <ScrollReveal delay={300}>
              <AnimatedHeroInvestigation />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 2. PROBLEM ═══ */}
      <section className="py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">The problem</h2>
              <h3 className="text-[32px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">
                Fraud doesn&apos;t look like fraud
              </h3>
              <p className="text-[16px] text-[var(--ink-secondary)] leading-relaxed max-w-[600px] mx-auto">
                Money launderers don&apos;t trip a single alarm. They spread funds across webs of accounts, moving in loops and small bursts that stay under the radar. By the time a person spots the pattern, the money is gone.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 gap-5">
            <ScrollReveal>
              <InteractiveCard className="text-center">
                <p className="text-[36px] font-bold text-[var(--brand-navy)] mb-1">
                  <AnimatedCounter prefix="$" value={2.1} decimals={1} suffix="T" />
                </p>
                <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">Laundered through the financial system every year</p>
                <p className="text-[11px] text-[var(--ink-muted)] mt-2 italic">UNODC estimate</p>
              </InteractiveCard>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <InteractiveCard className="text-center">
                <p className="text-[36px] font-bold text-[var(--brand-navy)] mb-1">
                  <AnimatedCounter value={95} suffix="%" />+
                </p>
                <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">Of AML alerts are false positives, causing alert fatigue</p>
                <p className="text-[11px] text-[var(--ink-muted)] mt-2 italic">Industry benchmark</p>
              </InteractiveCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <InteractiveCard className="text-center">
                <p className="text-[36px] font-bold text-[var(--brand-navy)] mb-1">Hours</p>
                <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">Spent per case building narratives by hand</p>
                <p className="text-[11px] text-[var(--ink-muted)] mt-2 italic">Typical investigator workload</p>
              </InteractiveCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 3. SOLUTION ═══ */}
      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">The solution</h2>
              <h3 className="text-[32px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">
                From raw transactions to a case your team can act on
              </h3>
              <p className="text-[16px] text-[var(--ink-secondary)] max-w-[600px] mx-auto leading-relaxed">
                Sentinel watches every transaction, flags the patterns that matter, and builds a complete investigation file — with evidence your investigators can verify.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 gap-5">
            <ScrollReveal>
              <InteractiveCard accent>
                <p className="text-[11px] font-mono font-bold text-[var(--brand-orange)] mb-3 tracking-wider">01 · DETECT</p>
                <h4 className="text-[20px] font-semibold text-[var(--brand-navy)] mb-2">Pattern detection</h4>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed">
                  Three detectors scan every transaction: circular flows, fan-out smurfing, and dense clusters.
                </p>
              </InteractiveCard>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <InteractiveCard accent>
                <p className="text-[11px] font-mono font-bold text-[var(--brand-orange)] mb-3 tracking-wider">02 · EXPLAIN</p>
                <h4 className="text-[20px] font-semibold text-[var(--brand-navy)] mb-2">AI explanation</h4>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed">
                  Plain-English explanation with citations. Every claim links to the underlying evidence.
                </p>
              </InteractiveCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <InteractiveCard accent>
                <p className="text-[11px] font-mono font-bold text-[var(--brand-orange)] mb-3 tracking-wider">03 · DECIDE</p>
                <h4 className="text-[20px] font-semibold text-[var(--brand-navy)] mb-2">Investigator decides</h4>
                <p className="text-[14px] text-[var(--ink-secondary)] leading-relaxed">
                  Complete case file — timeline, parties, narrative, SAR fields — ready to escalate or close.
                </p>
              </InteractiveCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 4. HOW IT WORKS — pipeline ═══ */}
      <section className="bg-[var(--brand-navy)] py-16 text-white relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${15 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-[800px] mx-auto px-6 relative">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">How it works</h2>
              <h3 className="text-[32px] font-bold mb-3 tracking-tight">Five layers, one pipeline</h3>
              <p className="text-[16px] text-white/70 max-w-[500px] mx-auto leading-relaxed">
                Every layer adds intelligence the investigator can verify.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-0">
            {[
              { layer: 'Graph Intelligence', tech: 'NetworkX', desc: 'Models transactions as a directed graph. Detects circular flows, fan-out, and dense clusters.' },
              { layer: 'ML Risk Scoring', tech: 'RandomForest + 7 rules', desc: 'Hybrid score combines a transparent rule engine with a trained ML model. 0–100, auditable.' },
              { layer: 'Agentic AI', tech: '3 agents', desc: 'Alert Agent classifies priority. Case Builder assembles the SAR. Explanation Agent writes the summary with citations.' },
              { layer: 'FastAPI Service', tech: '6 endpoints', desc: 'REST API serves the full pipeline with sub-500ms latency. Schema-validated.' },
              { layer: 'Investigation Workspace', tech: 'Next.js', desc: 'Two-pane workspace: reasoning on the left, graph and audit on the right. Decisions in the header.' },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="flex items-start gap-5 relative">
                  {/* Connector line */}
                  {i < 4 && (
                    <div className="absolute left-[19px] top-12 bottom-0 w-px bg-white/20" aria-hidden="true" />
                  )}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--brand-orange)] flex items-center justify-center text-[var(--brand-navy)] font-bold tabular text-[14px] relative z-10">
                    {i + 1}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-[17px] font-semibold">{item.layer}</h4>
                      <span className="text-[11px] font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded">{item.tech}</span>
                    </div>
                    <p className="text-[14px] text-white/70 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, -20px); }
          }
        `}</style>
      </section>

      {/* ═══ 5. INTERACTIVE PREVIEW ═══ */}
      <section className="py-16">
        <div className="max-w-[1100px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">See it in action</h2>
              <h3 className="text-[32px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">
                A workspace built for decisions, not dashboards
              </h3>
              <p className="text-[16px] text-[var(--ink-secondary)] max-w-[500px] mx-auto">
                Every case opens with the AI assessment, evidence, and a decision panel — no digging through tabs.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            {/* Full-width browser frame */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden">
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
              <div className="bg-[var(--bg-canvas)] p-5 grid grid-cols-[1fr_1fr] gap-4">
                {/* Left pane */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-[90px] h-[48px] rounded-full bg-[var(--bg-inset)] relative flex items-end justify-center">
                      <div className="absolute inset-x-2 bottom-0 h-[32px] rounded-full bg-[var(--risk-critical)] opacity-90" style={{ clipPath: 'polygon(0 100%, 0 40%, 100% 40%, 100% 100%)' }} />
                      <span className="absolute text-[18px] font-bold tabular text-[var(--risk-critical)]" style={{ top: '-6px' }}>85</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1.5 mb-1">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--risk-critical-soft)] text-[var(--risk-critical)]">Critical</span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--brand-orange-soft)] text-[var(--risk-high)]">Circular</span>
                      </div>
                      <p className="text-[11px] leading-snug text-[var(--ink-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>
                        Account C1001 shows a circular transaction pattern involving $970,000 — funds moved through 4 accounts before returning to the originator.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded p-2">
                      <p className="text-[8px] uppercase text-[var(--ink-muted)] font-semibold">Flagged</p>
                      <p className="text-[15px] font-bold tabular text-[var(--ink-primary)]">$970K</p>
                    </div>
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded p-2">
                      <p className="text-[8px] uppercase text-[var(--ink-muted)] font-semibold">Accounts</p>
                      <p className="text-[15px] font-bold tabular text-[var(--ink-primary)]">4</p>
                    </div>
                    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded p-2">
                      <p className="text-[8px] uppercase text-[var(--ink-muted)] font-semibold">Action</p>
                      <p className="text-[13px] font-semibold text-[var(--risk-critical)]">Freeze</p>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded p-2.5">
                    <p className="text-[8px] uppercase text-[var(--ink-muted)] font-semibold mb-1.5">Timeline</p>
                    <div className="space-y-1">
                      {['step 100 · Transfer to C1002 · $500K', 'step 103 · Received from C1004 · $470K'].map((t, i) => (
                        <div key={i} className="text-[10px] font-mono text-[var(--ink-secondary)] py-1 border-b border-[var(--border)] last:border-0">{t}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Right pane — graph */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] flex items-center justify-center relative">
                  <svg viewBox="0 0 200 180" className="w-full h-full p-4">
                    <line x1="100" y1="40" x2="160" y2="90" stroke="var(--brand-blue)" strokeWidth="2" />
                    <line x1="160" y1="90" x2="140" y2="150" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <line x1="140" y1="150" x2="60" y2="150" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <line x1="60" y1="150" x2="40" y2="90" stroke="var(--brand-blue)" strokeWidth="2" />
                    <line x1="40" y1="90" x2="100" y2="40" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <circle cx="100" cy="40" r="14" fill="var(--brand-orange)" stroke="var(--brand-navy)" strokeWidth="1.5" />
                    <text x="100" y="44" textAnchor="middle" fill="var(--brand-navy)" fontSize="7" fontFamily="monospace" fontWeight="700">C1001</text>
                    <circle cx="160" cy="90" r="10" fill="white" stroke="var(--brand-navy)" strokeWidth="1.5" />
                    <circle cx="140" cy="150" r="10" fill="white" stroke="var(--brand-navy)" strokeWidth="1.5" />
                    <circle cx="60" cy="150" r="10" fill="white" stroke="var(--brand-navy)" strokeWidth="1.5" />
                    <circle cx="40" cy="90" r="10" fill="white" stroke="var(--brand-navy)" strokeWidth="1.5" />
                  </svg>
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-[var(--ink-muted)] uppercase tracking-wider">Network graph</div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="text-center mt-8">
              <Link href="/contact">
                <Button variant="primary" size="lg">See it with your data →</Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ 6. EXPLAINABLE AI — alternating layout ═══ */}
      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 gap-12 items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">Explainable AI</h2>
                <h3 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">
                  Every claim has a source
                </h3>
                <p className="text-[15px] text-[var(--ink-secondary)] leading-relaxed mb-5">
                  The AI doesn&apos;t just flag risk — it explains its reasoning in plain English, with citations your investigators can verify in one click. No black box.
                </p>
                <ul className="space-y-2.5">
                  {[
                    'Plain-English explanation of why each account was flagged',
                    'Citation chips link every claim to the underlying evidence',
                    'Confidence score on every AI assessment',
                    'Full agent reasoning chain in the audit pane',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[14px] text-[var(--ink-primary)]">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--risk-low-soft)] flex items-center justify-center mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--risk-low)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow)]">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Why this account was flagged</p>
                <p className="text-[15px] leading-[1.7] text-[var(--ink-primary)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  Account C1001 has been flagged with a risk score of 85/100, indicating a high probability of money laundering activity. A circular transaction pattern was detected involving a total amount of $970,000.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border)] text-[11px] font-mono text-[var(--ink-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-info)]" />Risk score: 85/100
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border)] text-[11px] font-mono text-[var(--ink-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-orange)]" />Pattern: circular
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bg-inset)] border border-[var(--border)] text-[11px] font-mono text-[var(--ink-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]" />Total: $970,000
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
                  <span>AI confidence</span>
                  <div className="flex-1 h-1 bg-[var(--border)] rounded-full overflow-hidden max-w-[80px]">
                    <div className="h-full bg-[var(--risk-low)] rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="tabular font-semibold text-[var(--risk-low)]">85%</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ 7. ENTERPRISE SECURITY ═══ */}
      <section className="py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">Enterprise security</h2>
              <h3 className="text-[32px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">Built for scrutiny</h3>
              <p className="text-[16px] text-[var(--ink-secondary)] max-w-[500px] mx-auto">
                Every action is logged. Every decision is recorded. Hand your auditors a complete trail on request.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-3 gap-5">
            {[
              { icon: '📋', title: 'Full audit trail', desc: 'Every view, escalation, and filing is timestamped with actor and reason. Compliance-ready.' },
              { icon: '🔐', title: 'Schema-validated', desc: 'Every API response is validated against locked JSON schemas. No drift, no surprises.' },
              { icon: '⚖', title: 'Human in control', desc: 'Sentinel builds the case. Your investigators make the call — escalate, close, or file.' },
            ].map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <InteractiveCard>
                  <div className="text-[28px] mb-3">{item.icon}</div>
                  <h4 className="text-[17px] font-semibold text-[var(--brand-navy)] mb-2">{item.title}</h4>
                  <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">{item.desc}</p>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8. BENEFITS ═══ */}
      <section className="bg-[var(--bg-inset)] py-16">
        <div className="max-w-[900px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-[12px] uppercase tracking-wider font-semibold text-[var(--brand-orange)] mb-2">Benefits</h2>
              <h3 className="text-[32px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">Workflow improvements that matter</h3>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-5">
            {[
              { metric: '10x', label: 'Faster case review', desc: 'AI-pre-built case files mean investigators start with the answer, not the search.' },
              { metric: '70%', label: 'Fewer false positives', desc: 'Hybrid scoring (rules + ML) cuts noise without missing real patterns.' },
              { metric: '100%', label: 'Explainable decisions', desc: 'Every flag has a citation. Every decision has a reason. No black boxes.' },
              { metric: '0', label: 'Tabs to switch', desc: 'Two-pane workspace: reasoning and graph visible together. No context-switching.' },
            ].map((item, i) => (
              <ScrollReveal key={item.label} delay={i * 80}>
                <InteractiveCard className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <p className="text-[40px] font-bold text-[var(--brand-orange)] tabular-lg leading-none">{item.metric}</p>
                  </div>
                  <div>
                    <h4 className="text-[17px] font-semibold text-[var(--brand-navy)] mb-1">{item.label}</h4>
                    <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </InteractiveCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. CTA ═══ */}
      <section className="bg-[var(--brand-navy)] py-20 text-white relative overflow-hidden">
        {/* Subtle graph pattern */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="white" />
                <line x1="30" y1="30" x2="90" y2="30" stroke="white" strokeWidth="0.5" />
                <line x1="30" y1="30" x2="30" y2="90" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>
        <ScrollReveal>
          <div className="max-w-[600px] mx-auto px-6 text-center relative">
            <Logo size={56} className="mx-auto mb-5" />
            <h2 className="text-[36px] font-bold mb-3 tracking-tight">See Sentinel with your data</h2>
            <p className="text-[16px] text-white/70 mb-8 max-w-[440px] mx-auto leading-relaxed">
              Request a demo and we&apos;ll walk you through a real investigation — from suspicious pattern to filed case.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/contact">
                <Button variant="primary" size="lg" className="bg-[var(--brand-orange)] text-[var(--brand-navy)] hover:bg-[var(--brand-orange-hover)] shadow-[0_4px_14px_rgba(255,165,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,165,0,0.4)] hover:-translate-y-0.5">
                  Request Demo →
                </Button>
              </Link>
              <Link href="/product">
                <Button variant="secondary" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white">
                  Explore the product
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
