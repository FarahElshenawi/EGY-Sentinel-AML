'use client';
import Link from 'next/link';
import Logo from './Logo';
interface HeaderProps { onLoadSample: () => void; loading: boolean; }
export default function Header({ onLoadSample, loading }: HeaderProps) {
  return (
    <header className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="font-serif text-lg font-bold text-[var(--text-primary)] leading-tight">SENTINEL <span style={{ color: 'var(--accent)' }}>AML</span></h1>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight uppercase tracking-wider">Case Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-2">← Dashboard</Link>
          <button onClick={onLoadSample} disabled={loading} className="px-4 py-2 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2" style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--accent) 100%)' }}>
            {loading ? (<><span className="spinner"></span>Loading...</>) : (<><span>🎯</span>Load Sample Scenario</>)}
          </button>
        </div>
      </div>
    </header>
  );
}
