import { CheckCircle2, Clock, Banknote, FileCheck, Gauge } from 'lucide-react';
import { RWF } from '../../lib/api';
import { DashHeader, Kpi, QueueCard, Section, TrendChart, ServiceChart } from '../../components/dash';
import type { DashData } from '../../components/dash';

export default function AnalystDashboard({ data }: { data: DashData }) {
  const k = data.kpis;
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DashHeader tag="Claims Analyst" tagTone="bg-indigo-100 text-indigo-700"
        title="Processing Workbench" subtitle="Verify eligibility, approve valid claims and process reimbursements" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Gauge} label="Avg Processing" value={`${k.avgProcessingHours}h`} tone="bg-indigo-50 text-indigo-600" sub="submission to resolution" />
        <Kpi icon={CheckCircle2} label="Approval Rate" value={`${k.approvalRate}%`} tone="bg-emerald-50 text-emerald-600" sub="of processed claims" />
        <Kpi icon={Banknote} label="Reimbursed" value={RWF(k.totalReimbursed)} tone="bg-teal-50 text-teal-600" sub={`${RWF(k.pendingAmount)} pending`} />
        <Kpi icon={FileCheck} label="Total Claims" value={k.totalClaims.toLocaleString()} tone="bg-sky-50 text-sky-600" sub="in system" />
      </div>

      <Section title="My Work Queues">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QueueCard icon={Clock} label="Awaiting eligibility verification" count={k.awaitingVerification} to="/claims?status=submitted" tone="bg-sky-50 text-sky-600" cta="Verify claims" />
          <QueueCard icon={CheckCircle2} label="Verified — awaiting approval" count={k.awaitingApproval} to="/claims?status=verified" tone="bg-indigo-50 text-indigo-600" cta="Approve claims" />
          <QueueCard icon={Banknote} label="Approved — ready to reimburse" count={k.awaitingReimbursement} to="/claims?status=approved" tone="bg-teal-50 text-teal-600" cta="Process payouts" />
        </div>
      </Section>

      <Section title="Throughput">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TrendChart trend={data.trend} />
          <ServiceChart byService={data.byService} />
        </div>
      </Section>
    </div>
  );
}
