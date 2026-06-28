'use client';

interface HeaderProps {
  onLoadSample: () => void;
  loading: boolean;
}

export default function Header({ onLoadSample, loading }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-gray-900 leading-tight">
              EGY-Sentinel <span className="text-accent">AML</span>
            </h1>
            <p className="text-xs text-gray-500 leading-tight">
              AI-Powered Financial Surveillance &amp; Fraud Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLoadSample}
            disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Loading...
              </>
            ) : (
              <>
                <span>🎯</span>
                Load Sample Scenario
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
