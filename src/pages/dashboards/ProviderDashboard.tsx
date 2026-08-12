import { Link } from 'react-router-dom';
import { FileText, Banknote, Clock, ShieldAlert, PlusCircle, CheckCircle2 } from 'lucide-react';
import { RWF } from '../../lib/api';
import { DashHeader, Kpi, Section, TrendChart, ServiceChart } from '../../components/dash';
import type { DashData } from '../../components/dash';

export default function ProviderDashboard({ data, name }: { data: DashData; name: string }) {
  const k = data.kpis;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <DashHeader tag="Healthcare Provider" tagTone="bg-emerald-100 text-emerald-700"
          title={`${name}`} subtitle="Your submitted claims, reimbursements and compliance standing" />
        <Link to="/submit" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <PlusCircle className="h-4 w-4" /> New Claim
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="My Claims" value={k.totalClaims.toLocaleString()} tone="bg-sky-50 text-sky-600" sub="submitted to date" />
        <Kpi icon={Banknote} label="Reimbursed" value={RWF(k.totalReimbursed)} tone="bg-emerald-50 text-emerald-600" sub={`${RWF(k.pendingAmount)} pending`} />
        <Kpi icon={CheckCircle2} label="Approval Rate" value={`${k.approvalRate}%`} tone="bg-teal-50 text-teal-600" sub="of your claims" />
        <Kpi icon={ShieldAlert} label="Flagged" value={String(k.flaggedClaims)} tone="bg-amber-50 text-amber-600" sub="need attention" />
      </div>

      {k.flaggedQueue > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            {k.flaggedQueue} of your claim(s) were flagged by the fraud engine and are under investigation.{' '}
            <Link to="/claims" className="font-semibold underline">Review them</Link>.
          </p>
        </div>
      )}

      <Section title="Your Submission Activity">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TrendChart trend={data.trend} />
          <ServiceChart byService={data.byService} />
        </div>
      </Section>

      <Section title="Pipeline">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Kpi icon={Clock} label="Submitted" value={String(k.awaitingVerification)} tone="bg-sky-50 text-sky-600" />
          <Kpi icon={Clock} label="Verified" value={String(k.awaitingApproval)} tone="bg-indigo-50 text-indigo-600" />
          <Kpi icon={Clock} label="Approved" value={String(k.awaitingReimbursement)} tone="bg-teal-50 text-teal-600" />
          <Kpi icon={Banknote} label="Total Billed" value={RWF(k.totalBilled)} tone="bg-slate-100 text-slate-600" />
        </div>
      </Section>
    </div>
  );
}
