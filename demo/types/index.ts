// TypeScript types matching the FastAPI Pydantic models (egysentinel/api/models.py)
// Single source of truth for frontend types. Do not duplicate.

export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'DEBIT' | 'PAYMENT' | 'TRANSFER';
export type RiskBand = 'low' | 'medium' | 'high';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type PatternType = 'circular' | 'fan_out' | 'fan_in' | 'layering' | 'dense_cluster' | 'none';
export type PartyRole = 'sender' | 'receiver' | 'intermediary' | 'subject';
export type CitationType = 'pattern' | 'anomaly' | 'score' | 'transaction';

export interface Account {
  account_id: string;
  type?: string;
  in_degree?: number;
  out_degree?: number;
  risk_score: number;
  risk_band: RiskBand;
  pattern_count?: number;
}

export interface Transaction {
  txn_id: string;
  step: number;
  type: TransactionType;
  amount: number;
  nameOrig: string;
  nameDest: string;
  oldbalanceOrg?: number;
  newbalanceOrig?: number;
  oldbalanceDest?: number;
  newbalanceDest?: number;
  isFraud?: number;
  isFlaggedFraud?: number;
}

export interface Alert {
  account_id: string;
  risk_score: number;
  risk_band: RiskBand;
  pattern_type: PatternType;
  priority: AlertPriority;
  summary: string;
  recommended_action: string;
  timestamp?: string;
}

export interface TimelineEntry {
  step: number;
  event: string;
  account_id: string;
  amount: number;
}

export interface Party {
  account_id: string;
  role: PartyRole;
  total_amount: number;
}

export interface SARFields {
  filing_reason: string;
  suspicious_activity_type: string;
  reporting_institution?: string;
  subject_info?: string;
}

export interface CaseReport {
  case_id: string;
  account_id: string;
  alert_id: string;
  timeline: TimelineEntry[];
  parties: Party[];
  total_amount: number;
  pattern_type: PatternType;
  narrative: string;
  sar_fields: SARFields;
  generated_at?: string;
}

export interface Citation {
  type: CitationType;
  value: string;
}

export interface Explanation {
  case_id: string;
  explanation_text: string;
  citations: Citation[];
  confidence: number;
  generated_at?: string;
}

// API response wrappers

export interface GraphNode {
  id: string;
  label: string;
  risk_score: number;
  risk_band: RiskBand;
  type: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  type: TransactionType;
  step: number;
  isFraud: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: { [key: string]: any };
}

export interface DetectResponse {
  patterns: any[];
  total_patterns: number;
  accounts_flagged: string[];
}

export interface InvestigateResponse {
  alert: Alert;
  case: CaseReport;
  explanation: Explanation;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}
