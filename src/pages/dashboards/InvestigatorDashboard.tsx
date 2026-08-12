import { Link } from 'react-router-dom';
import { ShieldAlert, Copy, TrendingUp, Building2, ArrowRight } from 'lucide-react';
import { RWF } from '../../lib/api';
import { DashHeader, Kpi, QueueCard, Section, RiskProviders } from '../../components/dash';
import type { DashData } from '../../components/dash';

export default function InvestigatorDashboard({ data }: { data: DashData }) {
  const k = data.kpis;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashHeader tag="Fraud Investigator" tagTone="bg-rose-100 text-rose-700"
        title="Investigation Desk" subtitle="Triage flagged claims, review anomalies and profile risky providers" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ShieldAlert} label="Flagged Claims" value={String(k.flaggedClaims)} tone="bg-rose-50 text-rose-600" sub={`${k.fraudRate}% of all claims`} />
        <Kpi icon={TrendingUp} label="Amount at Risk" value={RWF(k.atRiskAmount)} tone="bg-amber-50 text-amber-600" sub="pending decision" />
        <Kpi icon={Copy} label="Duplicate Signals" value={String(k.dupSignals)} tone="bg-orange-50 text-orange-600" sub="possible resubmissions" />
        <Kpi icon={Building2} label="High-Risk Providers" value={String(k.highRiskProviders)} tone="bg-slate-100 text-slate-600" sub="risk score ≥ 60" />
      </div>

      <Section title="My Queue">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QueueCard icon={ShieldAlert} label="Flagged claims to review" count={k.flaggedQueue} to="/fraud" tone="bg-rose-50 text-rose-600" cta="Open Fraud Center" />
          <QueueCard icon={Copy} label="Duplicate submissions" count={k.dupSignals} to="/fraud" tone="bg-amber-50 text-amber-600" cta="Investigate" />
          <QueueCard icon={Building2} label="Providers to profile" count={k.highRiskProviders} to="/providers" tone="bg-slate-100 text-slate-600" cta="View providers" />
        </div>
      </Section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskProviders providers={data.topProviders} />
        <Link to="/fraud" className="group">
          <div className="flex h-full flex-col justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-white p-6 transition group-hover:shadow-md">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
            <h3 className="mt-3 text-lg font-bold text-slate-900">Go to Fraud Center</h3>
            <p className="mt-1 text-sm text-slate-500">Review every flagged claim with its AI risk score, anomaly signals and feature contributions. Clear legitimate claims or reject confirmed fraud.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 group-hover:underline">Open investigation queue <ArrowRight className="h-4 w-4" /></span>
          </div>
        </Link>
      </div>
    </div>
  );
}
