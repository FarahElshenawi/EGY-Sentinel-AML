import type { InvestigateResponse } from '@/types';

export interface AgentStep {
  id: string; index: number; name: string; role: string; icon: string;
  status: 'completed' | 'processing' | 'pending';
  input: Record<string, unknown>; reasoning: string; output: Record<string, unknown>;
  confidence: number; duration: string; color: string;
  prompt: { system: string; user: string };
}
export interface AgentTraceData { agents: AgentStep[]; totalDuration: string; pipelineConfidence: number; }

export function buildAgentTrace(response: InvestigateResponse): AgentTraceData {
  const { alert, case: caseReport, explanation } = response;
  const agents: AgentStep[] = [
    {
      id: 'alert-agent', index: 1, name: 'Alert Agent', role: 'Priority Classification', icon: '🚨', status: 'completed',
      input: { account_id: alert.account_id, risk_score: alert.risk_score, risk_band: alert.risk_band, pattern_type: alert.pattern_type },
      reasoning: `Account ${alert.account_id} has a risk score of ${alert.risk_score}/100 (${alert.risk_band} band). The primary suspicious pattern is "${alert.pattern_type.replace('_', ' ')}". Given the severity of the pattern and the elevated risk score, this account warrants ${alert.priority} priority for investigation. Recommended action: ${alert.recommended_action}.`,
      output: { priority: alert.priority, summary: alert.summary, recommended_action: alert.recommended_action },
      confidence: 0.91, duration: '0.8s', color: 'var(--risk-high)',
      prompt: { system: 'You are an AML Alert Agent. Classify the alert priority and generate a one-line summary.', user: JSON.stringify({ account_id: alert.account_id, risk_score: alert.risk_score, risk_band: alert.risk_band, pattern_type: alert.pattern_type }, null, 2) },
    },
    {
      id: 'case-builder-agent', index: 2, name: 'Case Builder Agent', role: 'Investigation Report', icon: '📋', status: 'completed',
      input: { alert_id: `ALERT-${alert.account_id}`, account_id: alert.account_id, pattern_type: alert.pattern_type, parties: caseReport.parties.map((p) => p.account_id), transaction_count: caseReport.timeline.length },
      reasoning: `Assembled timeline from ${caseReport.timeline.length} transactions across ${caseReport.parties.length} accounts. Total flow: $${(caseReport.total_amount / 1_000_000).toFixed(2)}M. SAR fields populated based on FinCEN guidance for "${caseReport.sar_fields.suspicious_activity_type}". Filing reason: "${caseReport.sar_fields.filing_reason}".`,
      output: { case_id: caseReport.case_id, total_amount: caseReport.total_amount, pattern_type: caseReport.pattern_type, timeline_steps: caseReport.timeline.length, parties: caseReport.parties.length, sar_filing_reason: caseReport.sar_fields.filing_reason },
      confidence: 0.88, duration: '2.1s', color: 'var(--brand-primary)',
      prompt: { system: 'You are a Case Builder Agent. Build a structured SAR-style investigation report.', user: JSON.stringify({ alert: { priority: alert.priority, summary: alert.summary }, evidence: { accounts: caseReport.parties.map((p) => p.account_id), pattern_type: caseReport.pattern_type, timeline: caseReport.timeline } }, null, 2) },
    },
    {
      id: 'explanation-agent', index: 3, name: 'Explanation Agent', role: 'Plain-English Justification', icon: '💡', status: 'completed',
      input: { case_id: caseReport.case_id, pattern_type: caseReport.pattern_type, total_amount: caseReport.total_amount, risk_score: alert.risk_score },
      reasoning: explanation.explanation_text,
      output: { explanation_text: explanation.explanation_text, citations: explanation.citations, confidence: explanation.confidence },
      confidence: explanation.confidence, duration: '1.2s', color: 'var(--risk-info)',
      prompt: { system: 'You are an Explanation Agent. Produce a 3-5 sentence plain-English explanation with citations.', user: JSON.stringify({ case_id: caseReport.case_id, pattern_type: caseReport.pattern_type, narrative: caseReport.narrative, risk_score: alert.risk_score, total_amount: caseReport.total_amount }, null, 2) },
    },
  ];
  return { agents, totalDuration: '4.1s', pipelineConfidence: Math.min(...agents.map((a) => a.confidence)) };
}
