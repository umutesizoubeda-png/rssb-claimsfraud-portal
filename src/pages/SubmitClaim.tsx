import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { api, RWF } from '../lib/api';
import { Card, Badge } from '../components/ui';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import type { Beneficiary, Provider, Claim } from '../lib/types';

const SERVICE_TYPES = ['Consultation', 'Laboratory', 'Radiology', 'Surgery', 'Maternity', 'Pharmacy', 'Dental', 'Emergency', 'Inpatient'];

export default function SubmitClaim() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [memberId, setMemberId] = useState('');
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [eligMsg, setEligMsg] = useState('');

  const [providerId, setProviderId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState('Consultation');
  const [diagnosis, setDiagnosis] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Claim | null>(null);

  useEffect(() => {
    api<Provider[]>('/api/providers').then((p) => {
      setProviders(p);
      if (profile?.provider_id) setProviderId(String(profile.provider_id));
    }).catch(() => {});
  }, [profile]);

  const verify = async () => {
    if (!memberId.trim()) { setEligMsg('Enter a member ID.'); return; }
    setVerifying(true); setEligMsg(''); setBeneficiary(null);
    try {
      const list = await api<Beneficiary[]>(`/api/beneficiaries?member_id=${encodeURIComponent(memberId.trim())}`);
      if (!list.length) { setEligMsg('No beneficiary found with that member ID.'); return; }
      setBeneficiary(list[0]);
    } catch (e) {
      setEligMsg(e instanceof Error ? e.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!beneficiary) e.member = 'Verify an eligible beneficiary first.';
    if (!providerId) e.provider = 'Select a provider.';
    if (!serviceDate) e.date = 'Service date is required.';
    if (!diagnosis.trim()) e.diagnosis = 'Diagnosis is required.';
    if (!amount || Number(amount) <= 0) e.amount = 'Enter a valid amount.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const claim = await api<Claim>('/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          beneficiary_id: beneficiary!.id,
          provider_id: Number(providerId),
          service_date: serviceDate,
          service_type: serviceType,
          diagnosis,
          total_amount: Number(amount),
          notes,
          submitted_by: profile?.email || 'system',
        }),
      });
      setResult(claim);
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const high = result.fraud_score >= 60;
    const med = result.fraud_score >= 30 && result.fraud_score < 60;
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader title="Claim Submitted" subtitle={`Reference ${result.claim_number}`} />
        <Card className="mx-auto max-w-2xl overflow-hidden">
          <div className={`p-6 ${high ? 'bg-rose-50' : med ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <div className="flex items-center gap-3">
              {high ? <ShieldAlert className="h-9 w-9 text-rose-600" /> : med ? <ShieldAlert className="h-9 w-9 text-amber-600" /> : <CheckCircle2 className="h-9 w-9 text-emerald-600" />}
              <div>
                <p className="text-lg font-bold text-slate-900">{high ? 'Flagged for review' : med ? 'Accepted — elevated risk' : 'Accepted — low risk'}</p>
                <p className="text-sm text-slate-600">Fraud score: <span className="font-bold">{result.fraud_score}/100</span> · Anomaly: {result.anomaly_score}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400">Total billed</p><p className="font-semibold text-slate-900">{RWF(result.total_amount)}</p></div>
              <div><p className="text-slate-400">Covered amount</p><p className="font-semibold text-slate-900">{RWF(result.covered_amount)}</p></div>
              <div><p className="text-slate-400">Eligibility</p><Badge value={result.eligibility_status} /></div>
              <div><p className="text-slate-400">Status</p><Badge value={result.status} /></div>
            </div>
            {result.fraud_flags?.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Detected signals</p>
                <ul className="space-y-1 text-sm text-amber-900">
                  {result.fraud_flags.map((f, i) => <li key={i} className="flex gap-2"><span>•</span>{f}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate(`/claims/${result.id}`)} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">View claim</button>
              <button onClick={() => { setResult(null); setMemberId(''); setBeneficiary(null); setDiagnosis(''); setAmount(''); setNotes(''); }} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Submit another</button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Submit Claim" subtitle="Electronic submission with automated eligibility verification" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">1. Verify Beneficiary</h3>
          <p className="mb-4 text-xs text-slate-500">Confirm membership &amp; coverage before submitting.</p>
          <div className="flex gap-2">
            <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="e.g. RSSB-000123"
              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            <button onClick={verify} disabled={verifying} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Verify
            </button>
          </div>
          {eligMsg && <p className="mt-3 flex items-center gap-1.5 text-sm text-rose-600"><XCircle className="h-4 w-4" />{eligMsg}</p>}
          {beneficiary && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{beneficiary.full_name}</p>
                <Badge value={beneficiary.status} />
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-400">Scheme</dt><dd className="font-medium text-slate-700">{beneficiary.scheme}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Coverage</dt><dd className="font-medium text-slate-700">{beneficiary.coverage_percent}%</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">District</dt><dd className="font-medium text-slate-700">{beneficiary.district}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-400">Valid until</dt><dd className="font-medium text-slate-700">{beneficiary.valid_until}</dd></div>
              </dl>
              {beneficiary.status === 'active' ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Eligible for claims</p>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-600"><XCircle className="h-4 w-4" /> Membership {beneficiary.status}</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">2. Claim Details</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Provider</label>
                <select value={providerId} onChange={(e) => setProviderId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option value="">Select provider…</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.provider && <p className="mt-1 text-xs text-rose-600">{errors.provider}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Service date</label>
                <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {errors.date && <p className="mt-1 text-xs text-rose-600">{errors.date}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Service type</label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Total amount (RWF)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Diagnosis</label>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute malaria"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
              {errors.diagnosis && <p className="mt-1 text-xs text-rose-600">{errors.diagnosis}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            </div>
            {errors.member && <p className="text-sm text-rose-600">{errors.member}</p>}
            {errors.submit && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{errors.submit}</p>}
            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Run fraud check &amp; submit
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
