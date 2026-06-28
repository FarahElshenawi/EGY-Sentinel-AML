'use client';

import type { Alert } from '@/types';

interface AlertPanelProps {
  alert: Alert;
}

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

export default function AlertPanel({ alert }: AlertPanelProps) {
  const priorityClass = priorityColors[alert.priority] || priorityColors.medium;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-accent to-amber-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <span>🚨</span> Alert
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${priorityClass}`}>
            {alert.priority}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Account</p>
          <p className="font-mono font-semibold text-gray-900">{alert.account_id}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Score</p>
            <p className={`font-bold text-lg ${alert.risk_band === 'high' ? 'risk-high' : alert.risk_band === 'medium' ? 'risk-medium' : 'risk-low'}`}>
              {alert.risk_score}/100
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Band</p>
            <p className={`font-bold text-lg capitalize ${alert.risk_band === 'high' ? 'risk-high' : alert.risk_band === 'medium' ? 'risk-medium' : 'risk-low'}`}>
              {alert.risk_band}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pattern</p>
          <p className="text-sm font-medium text-gray-900 capitalize">{alert.pattern_type.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Summary</p>
          <p className="text-sm text-gray-800">{alert.summary}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Recommended Action</p>
          <p className="text-sm font-medium text-accent capitalize">{alert.recommended_action}</p>
        </div>
      </div>
    </div>
  );
}
