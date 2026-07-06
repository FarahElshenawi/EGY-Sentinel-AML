'use client';

import { useState } from 'react';
import type { AgentStep } from './agentData';
import JsonViewer from './JsonViewer';
import CitationChip from './CitationChip';

interface AgentCardProps { agent: AgentStep; isLast: boolean; }

export default function AgentCard({ agent, isLast }: AgentCardProps) {
  const [expanded, setExpanded] = useState(agent.index === 1);
  const [viewMode, setViewMode] = useState<'none' | 'json' | 'prompt'>('none');
  const confidencePercent = Math.round(agent.confidence * 100);
  const confidenceColor = confidencePercent >= 80 ? 'var(--risk-low)' : confidencePercent >= 50 ? 'var(--risk-medium)' : 'var(--risk-high)';

  return (
    <div className="relative">
      <div className="bg-[var(--bg-surface)] border rounded-lg overflow-hidden transition-all" style={{ borderColor: expanded ? 'var(--border-strong)' : 'var(--border-default)', boxShadow: expanded ? '0 2px 8px rgba(11,18,32,0.06)' : 'none' }}>
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: agent.color }}>
            <span className="font-mono text-sm tabular">{agent.index}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">{agent.icon}</span>
              <span className="font-semibold text-sm text-[var(--text-primary)]">{agent.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>✓ Done</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{agent.role}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Conf</span>
              <span className="tabular text-xs font-bold" style={{ color: confidenceColor }}>{confidencePercent}%</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-mono tabular mt-0.5">{agent.duration}</p>
          </div>
          <span className="flex-shrink-0 text-[var(--text-muted)] transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>
        {expanded && (
          <div className="border-t border-[var(--border-default)] px-4 py-3 space-y-3">
            <div>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">▸ Input</p>
              <div className="bg-[var(--bg-subtle)] rounded-md p-2.5"><pre className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto">{JSON.stringify(agent.input, null, 2)}</pre></div>
            </div>
            <div>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">▸ Reasoning</p>
              <div className="bg-[var(--brand-subtle)] rounded-md p-3 border-l-2" style={{ borderLeftColor: agent.color }}>
                <p className="text-[13px] leading-relaxed text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-serif)' }}>{agent.reasoning}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1.5">▸ Output</p>
              <div className="bg-[var(--bg-subtle)] rounded-md p-2.5">
                {agent.id === 'explanation-agent' && agent.output.citations && Array.isArray(agent.output.citations) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(agent.output.citations as Array<{ type: 'pattern' | 'anomaly' | 'score' | 'transaction'; value: string }>).map((citation, i) => (
                      <CitationChip key={i} type={citation.type} value={citation.value} />
                    ))}
                  </div>
                )}
                <pre className="text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed overflow-auto">{JSON.stringify(agent.output, null, 2)}</pre>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Agent Confidence</span>
                <span className="tabular font-bold" style={{ color: confidenceColor }}>{confidencePercent}%</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-inset)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${confidencePercent}%`, backgroundColor: confidenceColor }} />
              </div>
              {agent.id === 'explanation-agent' && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Confidence Breakdown</p>
                  {[
                    { label: 'Transaction Pattern', pct: 40, color: 'var(--risk-info)' },
                    { label: 'Entity Similarity', pct: 32, color: 'var(--brand-primary)' },
                    { label: 'Historical Cases', pct: 20, color: 'var(--risk-medium)' },
                    { label: 'Network Centrality', pct: 8, color: 'var(--risk-low)' },
                  ].map((factor, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] w-32 flex-shrink-0">{factor.label}</span>
                      <div className="flex-1 h-2 bg-[var(--bg-inset)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${factor.pct}%`, backgroundColor: factor.color }} />
                      </div>
                      <span className="tabular text-[10px] font-bold text-[var(--text-secondary)] w-8 text-right">{factor.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={() => setViewMode(viewMode === 'json' ? 'none' : 'json')} className="text-[10px] px-2.5 py-1 rounded font-mono font-semibold transition-colors" style={{ backgroundColor: viewMode === 'json' ? 'var(--brand-primary)' : 'var(--bg-subtle)', color: viewMode === 'json' ? '#fff' : 'var(--text-secondary)' }}>{'{ } View JSON'}</button>
              <button onClick={() => setViewMode(viewMode === 'prompt' ? 'none' : 'prompt')} className="text-[10px] px-2.5 py-1 rounded font-mono font-semibold transition-colors" style={{ backgroundColor: viewMode === 'prompt' ? 'var(--brand-primary)' : 'var(--bg-subtle)', color: viewMode === 'prompt' ? '#fff' : 'var(--text-secondary)' }}>{'📄 View Prompt'}</button>
            </div>
            {viewMode === 'json' && <div className="mt-2"><JsonViewer data={agent.output} label={`OUTPUT — ${agent.name}`} maxHeight="250px" /></div>}
            {viewMode === 'prompt' && (
              <div className="mt-2 space-y-2">
                <JsonViewer data={agent.prompt.system} label={`SYSTEM PROMPT — ${agent.name}`} maxHeight="200px" />
                <JsonViewer data={agent.prompt.user} label={`USER INPUT — ${agent.name}`} maxHeight="200px" />
              </div>
            )}
          </div>
        )}
      </div>
      {!isLast && (
        <div className="flex justify-center py-1.5">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-[var(--border-strong)]"></div>
            <span className="text-[var(--text-muted)] text-xs">▼</span>
          </div>
        </div>
      )}
    </div>
  );
}
