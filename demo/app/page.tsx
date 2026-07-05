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
      <SolutionSection />
      <PipelineSection />
      <DemoSection />
      <TechSection />
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
        <p className="lp-hero-tagline">Uncover the Hidden. Protect the System.</p>
        <p className="lp-hero-sub">AI-Powered Financial Surveillance that detects what traditional systems miss.</p>
        <div className="lp-hero-ctas">
          <Link href="/dashboard" className="lp-btn-primary">🚀 Launch Live Demo</Link>
          <a href="#solution" className="lp-btn-secondary">View Architecture</a>
        </div>
        <div className="lp-scroll-hint"><span>Scroll to explore</span><span className="lp-scroll-arrow">↓</span></div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const { ref, visible } = useScrollReveal();
  const stats = [
    { icon: '💰', value: '$2.1T', label: 'Laundered annually worldwide', source: 'UNODC estimate' },
    { icon: '🕸️', value: '99%', label: 'Of fraud goes undetected by rule-based systems', source: 'Industry benchmark' },
    { icon: '📉', value: '6.3M', label: 'Transactions in PaySim dataset — only 0.13% flagged as fraud', source: 'PaySim synthetic data' },
  ];
  return (
    <section className="lp-section lp-dark" ref={ref}>
      <FloatingNodes density={25} />
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title">The Hidden Threat</h2>
        <p className="lp-section-lead">Fraud is no longer visible. It lives inside networks.</p>
        <p className="lp-section-body">Traditional rule-based systems catch the obvious — single high-value transfers, known bad actors, simple thresholds. They miss the circular flows, the layering patterns, the dense clusters that money launderers build to obscure their tracks. By the time a human investigator spots the pattern, the money is gone.</p>
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

function SolutionSection() {
  const { ref, visible } = useScrollReveal();
  const pillars = [
    { icon: '🔗', title: 'Graph Intelligence', color: '#2563EB', description: 'Model transactions as a directed graph. Detect patterns that rules cannot — circular flows, fan-out smurfing, and dense clusters built to obscure money trails.', points: ['Circular transaction detection', 'Fan-out / fan-in analysis', 'Louvain community clustering'] },
    { icon: '🎯', title: 'ML Risk Scoring', color: '#0A2B5C', description: 'Combine a rule-based ensemble with XGBoost to rank every account on a 0–100 risk scale. Calibrated for class imbalance — catches the 0.13% that matter.', points: ['Rule ensemble (5 signals)', 'XGBoost classification', 'Combined final risk score'] },
    { icon: '🤖', title: 'Agentic Investigation', color: '#FFA500', description: 'Three GLM-powered AI agents build the full investigation — alert, case report, and plain-English explanation — with citations and confidence scores. No black box.', points: ['Alert Agent (priority + summary)', 'Case Builder (SAR-style report)', 'Explanation Agent (cited justification)'] },
  ];
  return (
    <section id="solution" className="lp-section lp-light" ref={ref}>
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title lp-dark-text">Our Vision</h2>
        <p className="lp-section-lead lp-dark-text">Transforming Detection into Intelligence</p>
        <div className="lp-pillar-grid">
          {pillars.map((pillar, i) => (
            <div key={i} className="lp-pillar-card" style={{ borderTopColor: pillar.color, animationDelay: `${i * 150}ms` }}>
              <div className="lp-pillar-icon" style={{ color: pillar.color }}>{pillar.icon}</div>
              <h3 className="lp-pillar-title" style={{ color: pillar.color }}>{pillar.title}</h3>
              <p className="lp-pillar-desc">{pillar.description}</p>
              <ul className="lp-pillar-points">
                {pillar.points.map((point, j) => (<li key={j} style={{ color: pillar.color }}><span className="lp-pillar-bullet" style={{ color: pillar.color }}>▸</span><span className="lp-dark-text">{point}</span></li>))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineSection() {
  const { ref, visible } = useScrollReveal();
  const stages = [
    { num: 1, label: 'DATA', desc: 'PaySim 30K sample', color: '#2563EB' },
    { num: 2, label: 'GRAPH', desc: 'NetworkX DiGraph', color: '#2563EB' },
    { num: 3, label: 'PATTERNS', desc: '3 detectors', color: '#0A2B5C' },
    { num: 4, label: 'RISK', desc: 'Rule + XGBoost', color: '#0A2B5C' },
    { num: 5, label: 'AGENTS', desc: '3 GLM agents', color: '#FFA500' },
    { num: 6, label: 'UI', desc: 'Live dashboard', color: '#FFA500' },
  ];
  return (
    <section className="lp-section lp-dark" ref={ref}>
      <FloatingNodes density={15} />
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title">How It Works</h2>
        <p className="lp-section-lead">From raw data to actionable intelligence</p>
        <div className="lp-pipeline">
          {stages.map((stage, i) => (
            <div key={i} className="lp-pipeline-stage">
              <div className="lp-pipeline-badge" style={{ backgroundColor: stage.color }}>{stage.num}</div>
              <p className="lp-pipeline-label">{stage.label}</p>
              <p className="lp-pipeline-desc">{stage.desc}</p>
              {i < stages.length - 1 && <div className="lp-pipeline-arrow">→</div>}
            </div>
          ))}
        </div>
        <p className="lp-pipeline-tagline">6 stages. 10 days. Zero compromise.</p>
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
        <p className="lp-section-lead lp-dark-text">Interactive demo — no signup required</p>
        <div className="lp-demo-frame">
          <div className="lp-demo-browser-bar">
            <div className="lp-demo-dots"><span></span><span></span><span></span></div>
            <div className="lp-demo-url">localhost:3000/dashboard</div>
          </div>
          <div className="lp-demo-content">
            <div className="lp-demo-kpis">
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">1</span><span className="lp-demo-kpi-lbl">CRITICAL</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">$1.74M</span><span className="lp-demo-kpi-lbl">FLAGGED</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">87%</span><span className="lp-demo-kpi-lbl">PRECISION</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">0.04</span><span className="lp-demo-kpi-lbl">DRIFT</span></div>
              <div className="lp-demo-kpi"><span className="lp-demo-kpi-val">1,204</span><span className="lp-demo-kpi-lbl">TXN/S</span></div>
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
                <div className="lp-demo-agent lp-demo-agent-1">🚨 Alert Agent · HIGH</div>
                <div className="lp-demo-agent lp-demo-agent-2">📋 Case Builder · CASE-0231</div>
                <div className="lp-demo-agent lp-demo-agent-3">💡 Explanation · 87% conf</div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-demo-cta"><Link href="/dashboard" className="lp-btn-primary lp-btn-lg">🚀 Launch Live Demo →</Link></div>
        <div className="lp-demo-features">
          <span>📊 Interactive graph — click any node</span>
          <span>🤖 Watch 3 AI agents build the case in real-time</span>
          <span>📜 Full audit trail with expandable payloads</span>
        </div>
      </div>
    </section>
  );
}

function TechSection() {
  const { ref, visible } = useScrollReveal();
  const techs = ['Python', 'FastAPI', 'NetworkX', 'XGBoost', 'scikit-learn', 'GLM (z-ai SDK)', 'Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Docker', 'Pandas', 'Pydantic', 'JupyterLab'];
  return (
    <section className="lp-section lp-dark" ref={ref}>
      <div className={`lp-container ${visible ? 'lp-visible' : ''}`}>
        <h2 className="lp-section-title">Built With</h2>
        <p className="lp-section-lead">100% Free Stack · No API keys · No cloud costs</p>
        <div className="lp-tech-grid">
          {techs.map((tech, i) => (<div key={i} className="lp-tech-badge" style={{ animationDelay: `${i * 50}ms` }}>{tech}</div>))}
        </div>
        <div className="lp-tech-note">
          <p>Every tool in this stack is open-source or free-tier. GLM is accessed via the <code className="lp-code">z-ai-web-dev-sdk</code> — no API key, no credit card, no usage limits. Total project cost: <strong>$0</strong>.</p>
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
          <p className="lp-footer-tagline">Uncover the Hidden. Protect the System.</p>
          <p className="lp-footer-meta">Capstone Project · 2026 · Built by 7 engineers in 10 days</p>
        </div>
      </div>
    </footer>
  );
}
