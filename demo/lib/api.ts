import type {
  GraphResponse, DetectResponse, Account, InvestigateResponse, CaseReport, HealthResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  detail: any;
  constructor(message: string, status: number, detail?: any) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(`API ${res.status}: ${res.statusText}`, res.status, detail);
    }
    return await res.json() as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Cannot reach API at ${url}. Is the FastAPI server running on :8000?`, 0, err);
  }
}

// ─── Decision types ───
export type DecisionType = 'escalate' | 'close' | 'needs_review' | 'generate_report';

export interface DecisionRequest {
  case_id: string;
  account_id: string;
  decision: DecisionType;
  reason: string;
  detail?: string;
  actor?: string;
}

export interface DecisionResponse {
  id: string;
  case_id: string;
  account_id: string;
  decision: string;
  reason: string;
  detail: string | null;
  actor: string;
  timestamp: string;
  status: string;
}

export const api = {
  health: () => fetchJson<HealthResponse>('/health'),
  getGraph: () => fetchJson<GraphResponse>('/graph'),
  detect: () => fetchJson<DetectResponse>('/detect', { method: 'POST' }),
  score: (accountId: string) => fetchJson<{ account: Account }>('/score', { method: 'POST', body: JSON.stringify({ account_id: accountId }) }),
  investigate: (accountId: string) => fetchJson<InvestigateResponse>('/investigate', { method: 'POST', body: JSON.stringify({ account_id: accountId }) }),
  buildCase: (accountId: string, alertId?: string) => fetchJson<{ case: CaseReport }>('/case', { method: 'POST', body: JSON.stringify({ account_id: accountId, alert_id: alertId }) }),

  // Decisions — escalate, close, needs review, generate report
  recordDecision: (req: DecisionRequest) =>
    fetchJson<DecisionResponse>('/api/v1/cases/decide', {
      method: 'POST',
      body: JSON.stringify(req),
    }),
  getDecisions: (caseId?: string) =>
    fetchJson<{ decisions: DecisionResponse[]; total: number }>(
      `/api/v1/cases/decisions${caseId ? `?case_id=${encodeURIComponent(caseId)}` : ''}`
    ),
};

export { ApiError };
