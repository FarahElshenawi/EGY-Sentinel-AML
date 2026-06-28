// Typed API client for the EGY-Sentinel AML FastAPI backend.
// All frontend components import from here — never call fetch() directly.

import type {
  GraphResponse,
  DetectResponse,
  Account,
  InvestigateResponse,
  CaseReport,
  HealthResponse,
  Transaction,
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
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(`API ${res.status}: ${res.statusText}`, res.status, detail);
    }
    return await res.json() as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network error (backend down, CORS, etc.)
    throw new ApiError(
      `Cannot reach API at ${url}. Is the FastAPI server running on :8000?`,
      0,
      err
    );
  }
}

export const api = {
  // ─── System ────────────────────────────────────────────────────────────
  health: () => fetchJson<HealthResponse>('/health'),

  // ─── Graph (for visualization) ─────────────────────────────────────────
  getGraph: () => fetchJson<GraphResponse>('/graph'),

  // ─── Detection ─────────────────────────────────────────────────────────
  detect: (transactions: Transaction[]) =>
    fetchJson<DetectResponse>('/detect', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    }),

  // ─── Scoring ───────────────────────────────────────────────────────────
  score: (accountId: string) =>
    fetchJson<{ account: Account }>('/score', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId }),
    }),

  // ─── Full agent pipeline (the centerpiece) ─────────────────────────────
  investigate: (accountId: string) =>
    fetchJson<InvestigateResponse>('/investigate', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId }),
    }),

  // ─── Case report only ──────────────────────────────────────────────────
  buildCase: (accountId: string, alertId?: string) =>
    fetchJson<{ case: CaseReport }>('/case', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, alert_id: alertId }),
    }),
};

export { ApiError };
