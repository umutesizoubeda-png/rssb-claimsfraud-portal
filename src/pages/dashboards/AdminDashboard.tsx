import {
  FileText, ShieldAlert, Banknote, Clock, CheckCircle2, Users, Building2, Activity,
} from 'lucide-react';
import { RWF } from '../../lib/api';
import { DashHeader, Kpi, Section, TrendChart, StatusChart, ServiceChart, RiskProviders } from '../../components/dash';
import type { DashData } from '../../components/dash';

export default function AdminDashboard({ data }: { data: DashData }) {
  const k = data.kpis;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashHeader tag="Administrator" tagTone="bg-slate-900 text-white"
        title="System Command Center" subtitle="Complete oversight of claims, fraud, finances and infrastructure" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Total Claims" value={k.totalClaims.toLocaleString()} tone="bg-sky-50 text-sky-600" sub={`${k.approvalRate}% approval rate`} />
        <Kpi icon={ShieldAlert} label="Fraud Rate" value={`${k.fraudRate}%`} tone="bg-amber-50 text-amber-600" sub={`${k.flaggedClaims} flagged claims`} />
        <Kpi icon={Banknote} label="Reimbursed" value={RWF(k.totalReimbursed)} tone="bg-emerald-50 text-emerald-600" sub={`${RWF(k.pendingAmount)} pending`} />
        <Kpi icon={Clock} label="Avg Processing" value={`${k.avgProcessingHours}h`} tone="bg-indigo-50 text-indigo-600" sub="submission to resolution" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi icon={Banknote} label="Total Billed" value={RWF(k.totalBilled)} tone="bg-teal-50 text-teal-600" />
        <Kpi icon={CheckCircle2} label="Approval Rate" value={`${k.approvalRate}%`} tone="bg-emerald-50 text-emerald-600" />
        <Kpi icon={Users} label="Active Members" value={k.activeBeneficiaries.toLocaleString()} tone="bg-violet-50 text-violet-600" />
        <Kpi icon={Building2} label="Providers" value={k.totalProviders.toLocaleString()} tone="bg-slate-100 text-slate-600" />
      </div>

      <Section title="Analytics">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><TrendChart trend={data.trend} /></div>
          <StatusChart statusCounts={data.statusCounts} />
        </div>
      </Section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ServiceChart byService={data.byService} />
        <RiskProviders providers={data.topProviders} />
      </div>

      <Section title="System Health">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi icon={Activity} label="Awaiting Verify" value={String(k.awaitingVerification)} tone="bg-sky-50 text-sky-600" />
          <Kpi icon={Activity} label="Awaiting Approval" value={String(k.awaitingApproval)} tone="bg-indigo-50 text-indigo-600" />
          <Kpi icon={Activity} label="Awaiting Payout" value={String(k.awaitingReimbursement)} tone="bg-teal-50 text-teal-600" />
          <Kpi icon={ShieldAlert} label="Flagged Queue" value={String(k.flaggedQueue)} tone="bg-rose-50 text-rose-600" />
        </div>
      </Section>
    </div>
  );
}
