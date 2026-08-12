import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, TrendingUp, AlertTriangle, Copy } from 'lucide-react';
import { api, RWF } from '../lib/api';
import { Card, Spinner, ErrorState, Badge } from '../components/ui';
import PageHeader from '../components/PageHeader';
import type { Claim } from '../lib/types';

export default function FraudCenter() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    api<Claim[]>('/api/claims').then(setClaims).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api<Claim[]>('/api/claims');
        if (mounted) setClaims(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const risky = useMemo(() => claims.filter((c) => c.fraud_score >= 30).sort((a, b) => b.fraud_score - a.fraud_score), [claims]);
  const high = risky.filter((c) => c.fraud_score >= 60);
  const dupSignals = claims.filter((c) => (c.fraud_flags || []).some((f) => f.toLowerCase().includes('duplicate')));
  const exposure = high.reduce((s, c) => s + Number(c.total_amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Fraud Center" subtitle="AI-driven detection: Random Forest scoring + Isolation Forest anomalies" />

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><ShieldAlert className="h-5 w-5" /></div>
              <div><p className="text-xs text-slate-500">High-risk claims</p><p className="text-2xl font-bold text-slate-900">{high.length}</p></div>
            </Card>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Copy className="h-5 w-5" /></div>
              <div><p className="text-xs text-slate-500">Duplicate signals</p><p className="text-2xl font-bold text-slate-900">{dupSignals.length}</p></div>
            </Card>
            <Card className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><TrendingUp className="h-5 w-5" /></div>
              <div><p className="text-xs text-slate-500">Amount at risk</p><p className="text-2xl font-bold text-slate-900">{RWF(exposure)}</p></div>
            </Card>
          </div>

          <Card className="mt-6 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900">Flagged &amp; elevated-risk claims</h3>
            </div>
            {risky.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-400">No suspicious claims detected.</p>
            ) : risky.map((c) => (
              <Link key={c.id} to={`/claims/${c.id}`} className="block border-b border-slate-50 px-5 py-4 transition hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${c.fraud_score >= 60 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{c.fraud_score}</span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">{c.claim_number}</p>
                      <p className="text-xs text-slate-400">{c.beneficiary?.full_name} · {c.provider?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">{RWF(c.total_amount)}</span>
                    <Badge value={c.status} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-14">
                  {(c.fraud_flags || []).map((f, i) => (
                    <span key={i} className="rounded-md bg-rose-50 px-2 py-0.5 text-xs text-rose-700">{f}</span>
                  ))}
                </div>
              </Link>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
