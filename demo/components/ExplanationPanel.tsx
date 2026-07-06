'use client';

import type { Explanation } from '@/types';
import { fmtConfidence } from '@/lib/format';

const citationTypeIcons: Record<string, string> = {
  pattern: '🔍', anomaly: '⚠', score: '📊', transaction: '💸',
};

export default function ExplanationPanel({ explanation }: { explanation: Explanation }) {
  const confidencePercent = Math.round(explanation.confidence * 100);
  const confidenceColor = confidencePercent >= 80 ? 'var(--risk-low)' : confidencePercent >= 50 ? 'var(--risk-medium)' : 'var(--risk-high)';

  return (
    <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-[var(--brand-primary)] text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm"><span>💡</span> Explanation</h3>
          <div className="text-right">
            <p className="text-[10px] opacity-75 uppercase tracking-wider">Confidence</p>
            <p className="tabular font-bold text-sm">{fmtConfidence(explanation.confidence)}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Why is this suspicious?</p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>{explanation.explanation_text}</p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Confidence Score</span>
            <span className="tabular font-bold" style={{ color: confidenceColor }}>{fmtConfidence(explanation.confidence)}</span>
          </div>
          <div className="h-2 bg-[var(--bg-inset)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${confidencePercent}%`, backgroundColor: confidenceColor }} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Evidence Citations</p>
          <div className="space-y-1.5">
            {explanation.citations.map((citation, i) => (
              <div key={i} className="flex items-start gap-2 bg-[var(--bg-subtle)] rounded p-2 text-sm">
                <span className="flex-shrink-0">{citationTypeIcons[citation.type] || '•'}</span>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">{citation.type}</span>
                  <p className="text-[var(--text-primary)]">{citation.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
