'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <div className="lp-root">
      <Hero mounted={mounted} />
      <ProblemSection />
      <HowItWorksSection />
      <TrustSection />
      <DemoSection />
      <Footer />
    </div>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function FloatingNodes({ density = 15 }: { density?: number }) {
  const [nodes, setNodes] = useState<Array<{ id: number; top: string; left: string; size: number; delay: number; duration: number; }>>([]);
  useEffect(() => {
    setNodes(Array.from({ length: density }, (_, i) => ({ id: i, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, size: 4 + Math.random() * 8, delay: Math.random() * 20, duration: 15 + Math.random() * 10 })));
  }, [density]);
  if (nodes.length === 0) return null;
  return (
    <div className="lp-floating-nodes" aria-hidden="true">
      {nodes.map((node) => (<div key={node.id} className="lp-node" style={{ top: node.top, left: node.left, width: `${node.size}px`, height: `${node.size}px`, animationDelay: `${node.delay}s`, animationDuration: `${node.duration}s` }} />))}
    </div>
  );
}

function Hero({ mounted }: { mounted: boolean }) {
  return (
    <section className="lp-hero">
      <FloatingNodes density={20} />
      <div className={`lp-hero-content ${mounted ? 'lp-visible' : ''}`}>
        <div className="lp-logo-wrapper"><Logo size={120} className="lp-logo" /></div>
        <h1 className="lp-hero-title"><span className="lp-gradient-text">SENTINEL AML</span></h1>
        <p className="lp-hero-tagline">See the money move before it disappears.</p>
        <p className="lp-hero-sub">Sentinel watches every transaction moving through your bank and hands your investigators a clear, evidence-backed case the moment something looks wrong — no spreadsheets, no guesswork.</p>
        <div className="lp-hero-ctas">
          <Link href="/cases" className="lp-btn-primary">Open the Investigator Console</Link>
          <a href="#how-it-works" className="lp-btn-secondary">See how it works</a>
        </div>
        <div className="lp-scroll-hint"><span>Scroll to explore</span><span className="lp-scroll-arrow">↓</span></div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const { ref, visible } = useScrollReveal();
  const stats = [
    { icon: '💰', value: '$2.1T', label: 'Moved through the financial system by launderers every year', source: 'UNODC estimate' },
    { icon: '🕸️', value: '99%', label: 'Of that activity slips past checklist-based screening', source: 'Industry benchmark' },
    { icon: '⏱️', value: 'Minutes', label: 'Is how long it takes Sentinel to turn a hunch into a filed case', source: 'Typical investigation time' },
  ];
  return (
    <section className="lp-section lp-dark" ref={ref}>
      <FloatingNodes density={25} />
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title">The Hidden Threat</h2>
        <p className="lp-section-lead">Fraud doesn&apos;t look like fraud. It looks like a normal day.</p>
        <p className="lp-section-body">Money launderers don&apos;t trip a single alarm — they spread funds across a web of accounts, moving them in loops and small bursts that stay just under the radar. Checklists and dollar thresholds miss that shape entirely. By the time a person notices the pattern by hand, the money is long gone.</p>
        <div className="lp-stat-grid">
          {stats.map((stat, i) => (
            <div key={i} className="lp-stat-card" style={{ animationDelay: `${i * 100}ms` }}>
              <span className="lp-stat-icon">{stat.icon}</span>
              <p className="lp-stat-value lp-gradient-text">{stat.value}</p>
              <p className="lp-stat-label">{stat.label}</p>
              <p className="lp-stat-source">{stat.source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { ref, visible } = useScrollReveal();
  const steps = [
    {
      num: 1,
      title: 'Sentinel watches every transfer',
      description: 'Every transaction that moves through your bank is mapped as it happens — who sent it, who received it, and how it connects to everything else.',
      icon: '👁️',
      color: '#2563EB',
    },
    {
      num: 2,
      title: 'It flags what a person would miss',
      description: 'Sentinel spots the shapes that matter — money looping back to where it started, one account fanning out to dozens of others, tight clusters moving funds among themselves.',
      icon: '🎯',
      color: '#0A2B5C',
    },
    {
      num: 3,
      title: 'Your investigator gets the full story',
      description: 'No dashboards to decode. Just a plain-English case file: what happened, why it matters, and the exact evidence behind every claim — ready to escalate or file.',
      icon: '📋',
      color: '#FFA500',
    },
  ];
  return (
    <section id="how-it-works" className="lp-section lp-light" ref={ref}>
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title lp-dark-text">How It Works</h2>
        <p className="lp-section-lead lp-dark-text">From raw activity to a case your team can act on — in three steps</p>
        <div className="lp-pillar-grid">
          {steps.map((step, i) => (
            <div key={i} className="lp-pillar-card" style={{ borderTopColor: step.color, animationDelay: `${i * 150}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="lp-pillar-icon" style={{ color: step.color, marginBottom: 0 }}>{step.icon}</div>
                <span className="text-xs font-mono font-bold" style={{ color: step.color }}>STEP {step.num}</span>
              </div>
              <h3 className="lp-pillar-title" style={{ color: step.color }}>{step.title}</h3>
              <p className="lp-pillar-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const { ref, visible } = useScrollReveal();
  const points = [
    { icon: '✅', title: 'Every claim has a source', desc: 'Investigators can click any statement in a case to see the exact transactions behind it.' },
    { icon: '🔒', title: 'Nothing happens quietly', desc: 'Every action — a view, an escalation, a filing — is recorded to an audit trail your compliance team can hand to a regulator.' },
    { icon: '🧑\u200d⚖️', title: 'People stay in control', desc: 'Sentinel builds the case. Your investigators make the call — escalate, close, or file, always with a reason on record.' },
  ];
  return (
    <section className="lp-section lp-dark" ref={ref}>
      <FloatingNodes density={12} />
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title">Built for Scrutiny</h2>
        <p className="lp-section-lead">Explainable by design — not a black box you have to trust blindly</p>
        <div className="lp-pillar-grid">
          {points.map((p, i) => (
            <div key={i} className="lp-pillar-card" style={{ background: 'rgba(255,255,255,0.03)', borderTop: 'none', borderLeft: '3px solid #FFA500', animationDelay: `${i * 120}ms` }}>
              <div className="lp-pillar-icon">{p.icon}</div>
              <h3 className="lp-pillar-title" style={{ color: '#F3F4F6' }}>{p.title}</h3>
              <p className="lp-pillar-desc" style={{ color: '#9CA3AF' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const { ref, visible } = useScrollReveal();
  return (
    <section className="lp-section lp-light" ref={ref}>
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title lp-dark-text">See It In Action</h2>
        <p className="lp-section-lead lp-dark-text">Walk through a real investigation — no signup required</p>
        <div className="lp-demo-frame">
          <div className="lp-demo-browser-bar">
            <div className="lp-demo-dots"><span></span><span></span><span></span></div>
            <div className="lp-demo-url">sentinel-aml.com/cases</div>
          </div>
          <div className="lp-demo-content">
            <div className="lp-demo-kpis">
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">1</span><span className="lp-demo-kpi-lbl">NEEDS REVIEW</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">$1.74M</span><span className="lp-demo-kpi-lbl">FLAGGED</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">87%</span><span className="lp-demo-kpi-lbl">ACCURACY</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">4</span><span className="lp-demo-kpi-lbl">OPEN CASES</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">1,204</span><span className="lp-demo-kpi-lbl">TXN REVIEWED/S</span></div>
            </div>
            <div className="lp-demo-panels">
              <div className="lp-demo-graph">
                <div className="lp-demo-node lp-demo-node-a">A</div>
                <div className="lp-demo-node lp-demo-node-b">B</div>
                <div className="lp-demo-node lp-demo-node-c">C</div>
                <div className="lp-demo-node lp-demo-node-d">D</div>
                <svg className="lp-demo-edges" viewBox="0 0 300 200">
                  <line x1="60" y1="50" x2="240" y2="50" stroke="#EC4899" strokeWidth="2" />
                  <line x1="240" y1="50" x2="240" y2="150" stroke="#EC4899" strokeWidth="2" />
                  <line x1="240" y1="150" x2="60" y2="150" stroke="#EC4899" strokeWidth="2" />
                  <line x1="60" y1="150" x2="60" y2="50" stroke="#EC4899" strokeWidth="2" />
                </svg>
              </div>
              <div className="lp-demo-side">
                <div className="lp-demo-agent lp-demo-agent-1">🔎 Pattern found · Money loops back to sender</div>
                <div className="lp-demo-agent lp-demo-agent-2">📋 Case file ready · CASE-0231</div>
                <div className="lp-demo-agent lp-demo-agent-3">💡 Explained in plain English · 87% confident</div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-demo-cta"><Link href="/cases" className="lp-btn-primary lp-btn-lg">Open the Investigator Console →</Link></div>
        <div className="lp-demo-features">
          <span>📊 Explore the money trail visually</span>
          <span>📖 Read a clear, sourced explanation for every flag</span>
          <span>📜 Hand auditors a complete record on request</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-content">
        <Logo size={56} className="lp-footer-logo" />
        <div className="lp-footer-text">
          <p className="lp-footer-brand">SENTINEL AML</p>
          <p className="lp-footer-tagline">See the money move before it disappears.</p>
          <p className="lp-footer-meta">Built for bank investigators, compliance teams, and the people they answer to.</p>
        </div>
      </div>
    </footer>
  );
}
