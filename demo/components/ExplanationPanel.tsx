'use client';

import type { Explanation } from '@/types';

interface ExplanationPanelProps {
  explanation: Explanation;
}

const citationTypeIcons: Record<string, string> = {
  pattern: '🔍',
  anomaly: '⚠',
  score: '📊',
  transaction: '💸',
};

export default function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  const confidencePercent = Math.round(explanation.confidence * 100);
  const confidenceColor = confidencePercent >= 80 ? 'text-green-600' : confidencePercent >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-accent-blue to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <span>💡</span> Explanation
          </h3>
          <div className="text-right">
            <p className="text-xs opacity-75 uppercase">Confidence</p>
            <p className="font-bold">{confidencePercent}%</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* Main explanation text */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Why is this suspicious?</p>
          <p className="text-sm text-gray-800 leading-relaxed">{explanation.explanation_text}</p>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Confidence Score</span>
            <span className={`font-bold ${confidenceColor}`}>{confidencePercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${confidencePercent >= 80 ? 'bg-green-500' : confidencePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* Citations */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Evidence Citations</p>
          <div className="space-y-1.5">
            {explanation.citations.map((citation, i) => (
              <div key={i} className="flex items-start gap-2 bg-gray-50 rounded p-2 text-sm">
                <span className="flex-shrink-0">{citationTypeIcons[citation.type] || '•'}</span>
                <div>
                  <span className="text-xs text-gray-500 uppercase">{citation.type}</span>
                  <p className="text-gray-800">{citation.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
