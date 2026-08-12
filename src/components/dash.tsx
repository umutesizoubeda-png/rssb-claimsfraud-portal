import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from './ui';
import type { DashData } from './dashHelpers';
import { STATUS_COLORS } from './dashHelpers';

export function Kpi({ icon: Icon, label, value, tone, sub }: { icon: React.ElementType; label: string; value: string; tone: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
      </div>
    </Card>
  );
}

export function QueueCard({ icon: Icon, label, count, to, tone, cta }: { icon: React.ElementType; label: string; count: number; to: string; tone: string; cta: string }) {
  return (
    <Link to={to} className="group block">
      <Card className="p-5 transition group-hover:shadow-md group-hover:ring-1 group-hover:ring-emerald-200">
        <div className="flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></div>
          <span className="text-3xl font-bold text-slate-900">{count}</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-xs font-medium text-emerald-600 group-hover:underline">{cta} →</p>
      </Card>
    </Link>
  );
}

export function TrendChart({ trend }: { trend: DashData['trend'] }) {
  const maxClaims = Math.max(1, ...trend.map((t) => t.claims));
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Claims Trend</h3>
      <div className="flex h-48 items-end gap-2">
        {trend.map((t) => (
          <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex w-full flex-1 items-end">
              <div className="w-full rounded-t-md bg-emerald-500/90" style={{ height: `${(t.claims / maxClaims) * 100}%` }} />
              {t.flagged > 0 && <div className="absolute bottom-0 w-full rounded-t-md bg-amber-400" style={{ height: `${(t.flagged / maxClaims) * 100}%` }} />}
            </div>
            <span className="text-[10px] font-medium text-slate-400">{t.month.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Claims</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Flagged</span>
      </div>
    </Card>
  );
}

export function StatusChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Status Breakdown</h3>
      <div className="mb-4 flex h-3 overflow-hidden rounded-full">
        {Object.entries(statusCounts).map(([s, c]) => (
          <div key={s} style={{ width: `${(c / total) * 100}%`, background: STATUS_COLORS[s] || '#94a3b8' }} />
        ))}
      </div>
      <div className="space-y-2">
        {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([s, c]) => (
          <div key={s} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s] || '#94a3b8' }} /><span className="capitalize text-slate-600">{s}</span></span>
            <span className="font-semibold text-slate-900">{c}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ServiceChart({ byService }: { byService: Record<string, number> }) {
  const services = Object.entries(byService).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...services.map(([, v]) => v));
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Claims by Service Type</h3>
      <div className="space-y-3">
        {services.map(([name, count]) => (
          <div key={name}>
            <div className="mb-1 flex justify-between text-xs"><span className="text-slate-600">{name}</span><span className="font-semibold text-slate-900">{count}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${(count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RiskProviders({ providers }: { providers: DashData['topProviders'] }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Highest-Risk Providers</h3>
      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-400">{p.flagged_claims}/{p.total_claims} flagged</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${p.risk_score >= 60 ? 'bg-rose-500' : p.risk_score >= 30 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, p.risk_score)}%` }} />
              </div>
              <Badge value={p.risk_level} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashHeader({ title, subtitle, tag, tagTone }: { title: string; subtitle: string; tag: string; tagTone: string }) {
  return (
    <div className="mb-6">
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tagTone}`}>{tag}</span>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </div>
  );
}
