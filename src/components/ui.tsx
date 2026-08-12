import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  verified: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  reimbursed: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  flagged: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  suspended: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  expired: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  medium: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  high: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export function Badge({ value, className = '' }: { value: string; className?: string }) {
  const style = STATUS_STYLES[value] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${style} ${className}`}>
      {value}
    </span>
  );
}

export function RiskMeter({ score }: { score: number }) {
  const color = score >= 60 ? 'bg-rose-500' : score >= 30 ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-600">{Math.round(score)}</span>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-16 text-center">
      <p className="text-sm font-medium text-rose-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          Try again
        </button>
      )}
    </div>
  );
}
