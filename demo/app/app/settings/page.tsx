/**
 * Settings — user profile and system status.
 */
'use client';

import TopBar from '@/components/organisms/TopBar';
import Badge from '@/components/atoms/Badge';

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <div className="px-8 py-6 max-w-[640px]">
        <h2 className="text-[24px] font-semibold text-[var(--ink-primary)] mb-1">Settings</h2>
        <p className="text-[13px] text-[var(--ink-secondary)] mb-8">User preferences and system configuration.</p>

        <section className="mb-8">
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Profile</h3>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-full bg-[var(--brand-orange)] text-[var(--brand-navy)] font-bold text-lg" style={{ width: 48, height: 48 }}>F</div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--ink-primary)]">Farah Elshenawi</p>
                <p className="text-[13px] text-[var(--ink-secondary)]">AML Investigator</p>
              </div>
              <div className="ml-auto"><Badge color="low" size="sm">Active</Badge></div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">System status</h3>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] divide-y divide-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] text-[var(--ink-primary)]">API service</span>
              <Badge color="low" size="sm">Connected</Badge>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] text-[var(--ink-primary)]">Pattern detection</span>
              <Badge color="low" size="sm">3 detectors active</Badge>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] text-[var(--ink-primary)]">ML risk scoring</span>
              <Badge color="low" size="sm">RandomForest loaded</Badge>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[13px] text-[var(--ink-primary)]">AI explanation</span>
              <Badge color="medium" size="sm">Fallback mode</Badge>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)] mb-3">Preferences</h3>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] divide-y divide-[var(--border)]">
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px] text-[var(--ink-primary)]">Keyboard shortcuts</p>
                <p className="text-[11px] text-[var(--ink-muted)]">Press / to focus search, J/K to navigate cases</p>
              </div>
              <Badge color="low" size="sm">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[13px] text-[var(--ink-primary)]">Audit trail logging</p>
                <p className="text-[11px] text-[var(--ink-muted)]">Every action is recorded for compliance</p>
              </div>
              <Badge color="low" size="sm">Always on</Badge>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
