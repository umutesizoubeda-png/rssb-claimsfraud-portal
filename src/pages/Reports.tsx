import { useEffect, useState } from 'react';
import { FileDown, FileText, ShieldAlert, RefreshCw, Clock, Printer } from 'lucide-react';
import { api, RWF } from '../lib/api';
import { Card, Spinner, ErrorState, Badge } from '../components/ui';
import PageHeader from '../components/PageHeader';
import { formatCAT, catFileStamp, downloadCSV, printPDF } from '../lib/report';

interface AuditEntry { action: string; actor: string; details: string; timestamp: string }
interface FlaggedRow {
  claim_number: string; beneficiary: string; member_id: string; provider: string; provider_risk: number;
  service_type: string; service_date: string; total_amount: number; fraud_score: number; anomaly_score: number;
  eligibility: string; status: string; flags: string[]; submitted_at: string; last_updated: string;
  audit_trail: AuditEntry[];
}
interface ReportData {
  generatedAt: string;
  summary: {
    totalClaims: number; flaggedClaims: number; fraudRate: number; approvedClaims: number; rejectedClaims: number;
    approvalRate: number; totalBilled: number; totalReimbursed: number; atRiskAmount: number; avgProcessingHours: number;
    activeBeneficiaries: number; totalProviders: number; highRiskProviders: number;
  };
  statusCounts: Record<string, number>;
  byService: Record<string, { count: number; amount: number }>;
  flaggedReport: FlaggedRow[];
  providerReport: { name: string; code: string; type: string; district: string; risk_score: number; risk_level: string; total_claims: number; flagged_claims: number }[];
  auditCount: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // `now` timestamp removed — not used directly by UI

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api<ReportData>('/api/reports');
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const exportSummaryCSV = () => {
    if (!data) return;
    const s = data.summary;
    const rows: (string | number)[][] = [
      ['RSSB Health Insurance — Claims & Fraud Detection Report'],
      ['Report generated on', formatCAT(data.generatedAt)],
      [],
      ['Metric', 'Value'],
      ['Total Claims', s.totalClaims],
      ['Flagged Claims', s.flaggedClaims],
      ['Fraud Rate (%)', s.fraudRate],
      ['Approved Claims', s.approvedClaims],
      ['Rejected Claims', s.rejectedClaims],
      ['Approval Rate (%)', s.approvalRate],
      ['Total Billed (RWF)', s.totalBilled],
      ['Total Reimbursed (RWF)', s.totalReimbursed],
      ['Amount At Risk (RWF)', s.atRiskAmount],
      ['Avg Processing Time (hours)', s.avgProcessingHours],
      ['Active Beneficiaries', s.activeBeneficiaries],
      ['Total Providers', s.totalProviders],
      ['High-Risk Providers', s.highRiskProviders],
      [],
      ['Status Breakdown'],
      ...Object.entries(data.statusCounts).map(([k, v]) => [k, v]),
      [],
      ['Service Type', 'Claims', 'Amount (RWF)'],
      ...Object.entries(data.byService).map(([k, v]) => [k, v.count, v.amount]),
    ];
    downloadCSV(`RSSB_Claims_Summary_${catFileStamp(data.generatedAt)}.csv`, rows);
  };

  const exportFlaggedCSV = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ['RSSB Health Insurance — Flagged Claims Audit Report'],
      ['Report generated on', formatCAT(data.generatedAt)],
      [],
      ['Claim #', 'Beneficiary', 'Member ID', 'Provider', 'Provider Risk', 'Service', 'Service Date', 'Amount (RWF)', 'Fraud Score', 'Anomaly', 'Eligibility', 'Status', 'Detected Signals', 'Submitted (CAT)', 'Last Updated (CAT)', 'Audit Trail'],
      ...data.flaggedReport.map((c) => [
        c.claim_number, c.beneficiary, c.member_id, c.provider, c.provider_risk, c.service_type, c.service_date,
        c.total_amount, c.fraud_score, c.anomaly_score, c.eligibility, c.status,
        (c.flags || []).join(' | '),
        formatCAT(c.submitted_at), c.last_updated ? formatCAT(c.last_updated) : '',
        (c.audit_trail || []).map((a) => `[${formatCAT(a.timestamp)}] ${a.action} by ${a.actor}: ${a.details}`).join(' || '),
      ]),
    ];
    downloadCSV(`RSSB_Flagged_Claims_Audit_${catFileStamp(data.generatedAt)}.csv`, rows);
  };

  const exportPDF = () => {
    if (!data) return;
    const s = data.summary;
    const kpi = (label: string, value: string) => `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`;
    const html = `
      <span class="badge">RSSB</span>
      <h1>RSSB Health Insurance — Claims &amp; Fraud Detection Report</h1>
      <div class="meta">Report generated on: <strong>${formatCAT(data.generatedAt)}</strong> &nbsp;·&nbsp; ${data.auditCount} audit records &nbsp;·&nbsp; Real-time reporting</div>
      <h2>Executive Summary</h2>
      <div class="grid">
        ${kpi('Total Claims', String(s.totalClaims))}
        ${kpi('Flagged Claims', String(s.flaggedClaims))}
        ${kpi('Fraud Rate', s.fraudRate + '%')}
        ${kpi('Approval Rate', s.approvalRate + '%')}
        ${kpi('Total Billed', RWF(s.totalBilled))}
        ${kpi('Total Reimbursed', RWF(s.totalReimbursed))}
        ${kpi('Amount At Risk', RWF(s.atRiskAmount))}
        ${kpi('Avg Processing', s.avgProcessingHours + 'h')}
      </div>
      <h2>Status Breakdown</h2>
      <table><tr><th>Status</th><th>Count</th></tr>
        ${Object.entries(data.statusCounts).map(([k, v]) => `<tr><td style="text-transform:capitalize">${k}</td><td>${v}</td></tr>`).join('')}
      </table>
      <h2>Flagged Claims — Timestamped Audit Trail</h2>
      <table>
        <tr><th>Claim #</th><th>Provider</th><th>Amount</th><th>Score</th><th>Signals &amp; Audit Trail</th></tr>
        ${data.flaggedReport.map((c) => `<tr>
          <td>${c.claim_number}<br/><span class="trail">${c.service_date}</span></td>
          <td>${c.provider}<br/><span class="trail">${c.beneficiary}</span></td>
          <td>${RWF(c.total_amount)}</td>
          <td><strong>${c.fraud_score}</strong>/100<br/><span class="trail">anom ${c.anomaly_score}</span></td>
          <td>
            ${(c.flags || []).map((f) => `<div class="flag">• ${f}</div>`).join('')}
            <div class="trail" style="margin-top:4px">${[{ action: 'CLAIM_SUBMITTED', actor: 'system', details: 'Submitted', timestamp: c.submitted_at }, ...(c.audit_trail || [])].map((a) => `↳ [${formatCAT(a.timestamp)}] ${a.action} — ${a.actor}`).join('<br/>')}</div>
          </td>
        </tr>`).join('')}
      </table>
      <h2>Provider Risk Profile</h2>
      <table><tr><th>Provider</th><th>District</th><th>Risk</th><th>Flagged / Total</th></tr>
        ${data.providerReport.map((p) => `<tr><td>${p.name}</td><td>${p.district}</td><td>${p.risk_score} (${p.risk_level})</td><td>${p.flagged_claims}/${p.total_claims}</td></tr>`).join('')}
      </table>
      <div class="footer">Rwanda Social Security Board (RSSB) · Confidential · Generated ${formatCAT(data.generatedAt)} · This report reflects real-time claims and fraud-detection data.</div>
    `;
    printPDF(`RSSB Claims Report ${catFileStamp(data.generatedAt)}`, html);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Exportable summaries with real-time timestamps and flagged-claim audit trails"
        action={
          <button onClick={load} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {loading ? <Spinner /> : error || !data ? <ErrorState message={error || 'No data'} onRetry={load} /> : (
        <>
          {/* Generation banner */}
          <Card className="mb-6 flex flex-col gap-4 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-sm font-extrabold text-slate-950">RSSB</div>
              <div>
                <p className="text-sm font-semibold">Claims &amp; Fraud Detection Report</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5" /> Report generated on: <span className="font-mono text-emerald-300">{formatCAT(data.generatedAt)}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{data.summary.totalClaims} claims · {data.summary.flaggedClaims} flagged · {data.auditCount} audit records</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportSummaryCSV} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20">
                <FileDown className="h-4 w-4" /> Summary CSV
              </button>
              <button onClick={exportFlaggedCSV} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-white/20">
                <ShieldAlert className="h-4 w-4" /> Flagged CSV
              </button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
                <Printer className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </Card>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Total Claims', String(data.summary.totalClaims)],
              ['Fraud Rate', `${data.summary.fraudRate}%`],
              ['Amount at Risk', RWF(data.summary.atRiskAmount)],
              ['Total Reimbursed', RWF(data.summary.totalReimbursed)],
              ['Approval Rate', `${data.summary.approvalRate}%`],
              ['Avg Processing', `${data.summary.avgProcessingHours}h`],
              ['High-Risk Providers', String(data.summary.highRiskProviders)],
              ['Rejected Claims', String(data.summary.rejectedClaims)],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1.5 text-xl font-bold text-slate-900">{value}</p>
              </Card>
            ))}
          </div>

          {/* Flagged claims audit trail */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Flagged Claims — Real-Time Audit Trail</h2>
            </div>
            {data.flaggedReport.length === 0 ? (
              <Card className="p-10 text-center text-sm text-slate-400">No flagged claims to report.</Card>
            ) : (
              <div className="space-y-4">
                {data.flaggedReport.map((c) => {
                  const trail: AuditEntry[] = [
                    { action: 'CLAIM_SUBMITTED', actor: c.member_id ? 'provider' : 'system', details: 'Claim submitted & scored', timestamp: c.submitted_at },
                    ...(c.audit_trail || []),
                  ];
                  return (
                    <Card key={c.claim_number} className="overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${c.fraud_score >= 60 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{c.fraud_score}</span>
                          <div>
                            <p className="font-mono text-sm font-semibold text-slate-900">{c.claim_number}</p>
                            <p className="text-xs text-slate-500">{c.beneficiary} · {c.provider}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-700">{RWF(c.total_amount)}</span>
                          <Badge value={c.status} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Detected signals · anomaly {c.anomaly_score}</p>
                          <ul className="space-y-1 text-sm text-slate-700">
                            {(c.flags || []).map((f, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">▸</span>{f}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><Clock className="h-3.5 w-3.5" /> Timestamped audit log</p>
                          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                            {trail.map((a, i) => (
                              <li key={i} className="relative">
                                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                <p className="font-mono text-[11px] text-emerald-700">{formatCAT(a.timestamp)}</p>
                                <p className="text-sm text-slate-800"><span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">{a.action}</span> {a.details}</p>
                                <p className="text-xs text-slate-400">by {a.actor}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <FileText className="h-3.5 w-3.5" /> Rwanda Social Security Board (RSSB) · Confidential real-time report · {formatCAT(data.generatedAt)}
          </p>
        </>
      )}
    </div>
  );
}
