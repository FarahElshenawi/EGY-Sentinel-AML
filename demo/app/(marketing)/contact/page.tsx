/**
 * Contact page — request demo form.
 */
'use client';

import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', institution: '', role: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production this would POST to an API. For now, show success state.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-[72px] min-h-screen flex items-center justify-center">
        <div className="max-w-[480px] mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--risk-low-soft)] flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--risk-low)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-[28px] font-bold text-[var(--brand-navy)] mb-3">Thank you</h1>
          <p className="text-[15px] text-[var(--ink-secondary)] leading-relaxed mb-8">
            We&apos;ve received your request. Our team will reach out within one business day to schedule a demo with your data.
          </p>
          <Button variant="secondary" size="md" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', institution: '', role: '', message: '' }); }}>
            Submit another request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[72px]">
      <section className="py-20">
        <div className="max-w-[560px] mx-auto px-6">
          <div className="text-center mb-12">
            <Badge color="orange" size="sm" className="mb-4">Contact</Badge>
            <h1 className="text-[36px] font-bold text-[var(--brand-navy)] mb-3 tracking-tight">Request a demo</h1>
            <p className="text-[15px] text-[var(--ink-secondary)] leading-relaxed">
              Tell us about your team and we&apos;ll schedule a walkthrough with real investigation scenarios.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">Name <span className="text-[var(--risk-critical)]">*</span></label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">Email <span className="text-[var(--risk-critical)]">*</span></label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  placeholder="jane@bank.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">Institution</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  placeholder="First National Bank"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                >
                  <option value="">Select…</option>
                  <option>AML Investigator</option>
                  <option>Compliance Officer</option>
                  <option>Chief Compliance Officer</option>
                  <option>Risk Manager</option>
                  <option>Technology Leader</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--ink-secondary)] mb-1.5 uppercase tracking-wider">What would you like to see?</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius)] px-3.5 py-2.5 text-[14px] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y"
                placeholder="Tell us about your current AML workflow and what you'd like to evaluate…"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" className="w-full">Request Demo</Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
