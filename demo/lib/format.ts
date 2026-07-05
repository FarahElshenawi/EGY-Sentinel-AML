export function fmtMoney(n: number): string { if (n === 0) return '$0'; if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`; if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`; return `$${Math.round(n).toLocaleString('en-US')}`; }
export function fmtNumber(n: number): string { return n.toLocaleString('en-US'); }
export function fmtPercent(n: number, decimals = 1): string { return `${(n * 100).toFixed(decimals)}%`; }
export function fmtConfidence(n: number): string { return `${(n * 100).toFixed(1)}%`; }
export function fmtTime(d: Date | string): string { const date = typeof d === 'string' ? new Date(d) : d; return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); }
export function fmtAudit(d: Date | string): string { const date = typeof d === 'string' ? new Date(d) : d; const yyyy = date.getFullYear(); const mm = String(date.getMonth() + 1).padStart(2, '0'); const dd = String(date.getDate()).padStart(2, '0'); const hh = String(date.getHours()).padStart(2, '0'); const mi = String(date.getMinutes()).padStart(2, '0'); const ss = String(date.getSeconds()).padStart(2, '0'); return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`; }
export function fmtDelta(n: number): string { if (n > 0) return `+${n}`; return `${n}`; }
export function fmtAccountId(id: string): string { if (id.length <= 8) return id; return `${id.slice(0, 5)}…${id.slice(-3)}`; }
