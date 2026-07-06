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

export const api = {
  health: () => fetchJson<HealthResponse>('/health'),
  getGraph: () => fetchJson<GraphResponse>('/graph'),
  // No payload needed — /detect operates on server-side loaded data
  detect: () => fetchJson<DetectResponse>('/detect', { method: 'POST' }),
  score: (accountId: string) => fetchJson<{ account: Account }>('/score', { method: 'POST', body: JSON.stringify({ account_id: accountId }) }),
  investigate: (accountId: string) => fetchJson<InvestigateResponse>('/investigate', { method: 'POST', body: JSON.stringify({ account_id: accountId }) }),
  buildCase: (accountId: string, alertId?: string) => fetchJson<{ case: CaseReport }>('/case', { method: 'POST', body: JSON.stringify({ account_id: accountId, alert_id: alertId }) }),
};

export { ApiError };
