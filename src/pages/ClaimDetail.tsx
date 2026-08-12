import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Loader2, Activity } from 'lucide-react';
import { api, RWF } from '../lib/api';
import { Card, Spinner, ErrorState, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import type { Claim } from '../lib/types';

import type { Role } from '../lib/types';

type Action = { label: string; next: string; tone: string; roles: Role[] };

const FLOW: Record<string, Action[]> = {
  submitted: [
    { label: 'Verify eligibility', next: 'verified', tone: 'bg-indigo-600 hover:bg-indigo-700', roles: ['admin', 'analyst'] },
    { label: 'Reject', next: 'rejected', tone: 'bg-rose-600 hover:bg-rose-700', roles: ['admin', 'analyst'] },
  ],
  flagged: [
    { label: 'Clear & verify', next: 'verified', tone: 'bg-indigo-600 hover:bg-indigo-700', roles: ['admin', 'investigator'] },
    { label: 'Reject (fraud)', next: 'rejected', tone: 'bg-rose-600 hover:bg-rose-700', roles: ['admin', 'investigator'] },
  ],
  verified: [
    { label: 'Approve claim', next: 'approved', tone: 'bg-emerald-600 hover:bg-emerald-700', roles: ['admin', 'analyst'] },
    { label: 'Reject', next: 'rejected', tone: 'bg-rose-600 hover:bg-rose-700', roles: ['admin', 'analyst'] },
  ],
  approved: [
    { label: 'Process reimbursement', next: 'reimbursed', tone: 'bg-teal-600 hover:bg-teal-700', roles: ['admin', 'analyst'] },
  ],
};

const STEPS = ['submitted', 'verified', 'approved', 'reimbursed'];

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState('');

  const load = () => {
    setLoading(true); setError('');
    api<Claim>(`/api/claims?id=${id}`).then(setClaim).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api<Claim>(`/api/claims?id=${id}`);
        if (mounted) setClaim(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const advance = async (next: string) => {
    setActing(next);
    try {
      await api('/api/claims', { method: 'PUT', body: JSON.stringify({ id: Number(id), status: next, actor: profile?.email }) });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setActing('');
    }
  };

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error || !claim) return <div className="p-6"><ErrorState message={error || 'Claim not found'} onRetry={load} /></div>;

  const role = (profile?.role || 'analyst') as Role;
  const actions = (FLOW[claim.status] || []).filter((a) => a.roles.includes(role));
  const canAct = actions.length > 0;
  const stepIdx = STEPS.indexOf(claim.status === 'flagged' ? 'submitted' : claim.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">{claim.claim_number}</h1>
          <p className="mt-1 text-sm text-slate-500">Submitted {new Date(claim.created_at).toLocaleString()} by {claim.submitted_by}</p>
        </div>
        <Badge value={claim.status} className="text-sm" />
      </div>

      {claim.status !== 'rejected' && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIdx && claim.status === 'reimbursed' ? 'bg-emerald-500 text-white' : i <= stepIdx ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                  <span className={`text-xs font-medium capitalize ${i <= stepIdx ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < stepIdx ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Claim Information</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-400">Beneficiary</dt><dd className="font-medium text-slate-800">{claim.beneficiary?.full_name || 'Unknown'}</dd></div>
              <div><dt className="text-slate-400">Member ID</dt><dd className="font-medium text-slate-800">{claim.beneficiary?.member_id || '—'}</dd></div>
              <div><dt className="text-slate-400">Provider</dt><dd className="font-medium text-slate-800">{claim.provider?.name || 'Unknown'}</dd></div>
              <div><dt className="text-slate-400">Provider type</dt><dd className="font-medium text-slate-800">{claim.provider?.type || '—'}</dd></div>
              <div><dt className="text-slate-400">Service type</dt><dd className="font-medium text-slate-800">{claim.service_type}</dd></div>
              <div><dt className="text-slate-400">Service date</dt><dd className="font-medium text-slate-800">{claim.service_date}</dd></div>
              <div className="col-span-2"><dt className="text-slate-400">Diagnosis</dt><dd className="font-medium text-slate-800">{claim.diagnosis}</dd></div>
              {claim.notes && <div className="col-span-2"><dt className="text-slate-400">Notes</dt><dd className="text-slate-700">{claim.notes}</dd></div>}
            </dl>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
              <div><p className="text-xs text-slate-400">Total billed</p><p className="text-lg font-bold text-slate-900">{RWF(claim.total_amount)}</p></div>
              <div><p className="text-xs text-slate-400">Coverage</p><p className="text-lg font-bold text-slate-900">{claim.beneficiary?.coverage_percent ?? 0}%</p></div>
              <div><p className="text-xs text-slate-400">Reimbursable</p><p className="text-lg font-bold text-emerald-600">{RWF(claim.covered_amount)}</p></div>
            </div>
          </Card>

          {['submitted', 'verified', 'approved', 'flagged'].includes(claim.status) && (
            <Card className="p-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Approval Workflow</h3>
              {canAct ? (
                <>
                  <p className="mb-4 text-xs text-slate-500">
                    {claim.status === 'flagged'
                      ? 'This claim was flagged by the fraud engine and requires an investigator decision.'
                      : 'Advance this claim through the reimbursement lifecycle.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {actions.map((a) => (
                      <button key={a.next} onClick={() => advance(a.next)} disabled={!!acting}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${a.tone}`}>
                        {acting === a.next && <Loader2 className="h-4 w-4 animate-spin" />}{a.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  {claim.status === 'flagged'
                    ? 'Only a Fraud Investigator or Administrator can action flagged claims.'
                    : 'Only a Claims Analyst or Administrator can action claims at this stage.'}
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className={`overflow-hidden ${claim.fraud_score >= 60 ? 'ring-1 ring-rose-200' : ''}`}>
            <div className={`flex items-center gap-2 p-4 ${claim.fraud_score >= 60 ? 'bg-rose-50' : claim.fraud_score >= 30 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <ShieldAlert className={`h-5 w-5 ${claim.fraud_score >= 60 ? 'text-rose-600' : claim.fraud_score >= 30 ? 'text-amber-600' : 'text-emerald-600'}`} />
              <h3 className="text-sm font-semibold text-slate-900">Fraud Analysis</h3>
            </div>
            <div className="p-5">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-slate-900">{claim.fraud_score}</span>
                <span className="mb-1 text-sm text-slate-400">/100 risk score</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Isolation Forest anomaly: <span className="font-semibold">{claim.anomaly_score}</span> · Eligibility: <Badge value={claim.eligibility_status} /></p>

              {claim.fraud_contributions?.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"><Activity className="h-3.5 w-3.5" /> Feature contributions</p>
                  <div className="space-y-2">
                    {claim.fraud_contributions.map((f, i) => (
                      <div key={i}>
                        <div className="mb-0.5 flex justify-between text-xs"><span className="text-slate-600">{f.feature}</span><span className="font-semibold text-slate-800">+{f.weight}</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.min(100, f.weight * 2)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Detected signals</p>
                {claim.fraud_flags?.length ? (
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {claim.fraud_flags.map((f, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">▸</span>{f}</li>)}
                  </ul>
                ) : <p className="text-sm text-emerald-600">No suspicious patterns detected.</p>}
              </div>
            </div>
          </Card>

          {claim.provider && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Provider Profile</h3>
              <p className="font-medium text-slate-800">{claim.provider.name}</p>
              <p className="text-xs text-slate-400">{claim.provider.district} · {claim.provider.type}</p>
              <div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">Risk level</span><Badge value={claim.provider.risk_level} /></div>
              <div className="mt-1.5 flex items-center justify-between text-sm"><span className="text-slate-500">Flagged claims</span><span className="font-semibold text-slate-800">{claim.provider.flagged_claims}/{claim.provider.total_claims}</span></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
