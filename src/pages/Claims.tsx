import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { api, RWF } from '../lib/api';
import { Card, Spinner, ErrorState, Badge } from '../components/ui';
import PageHeader from '../components/PageHeader';
import type { Claim } from '../lib/types';

const FILTERS = ['all', 'submitted', 'verified', 'approved', 'reimbursed', 'flagged', 'rejected'];

export default function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && FILTERS.includes(s)) Promise.resolve().then(() => setFilter(s));
  }, [searchParams]);

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

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.claim_number.toLowerCase().includes(q) ||
          (c.beneficiary?.full_name || '').toLowerCase().includes(q) ||
          (c.provider?.name || '').toLowerCase().includes(q) ||
          (c.diagnosis || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [claims, filter, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Claims" subtitle={`${claims.length} claims in the system`} />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search claim #, member, provider, diagnosis…"
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </Card>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <div className="col-span-2">Claim</div>
            <div className="col-span-3">Beneficiary / Provider</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">Risk</div>
            <div className="col-span-2">Status</div>
          </div>
          {filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-400">No claims match your filters.</p>
          ) : filtered.map((c) => (
            <Link key={c.id} to={`/claims/${c.id}`}
              className="grid grid-cols-1 gap-2 border-b border-slate-50 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-12 md:items-center md:gap-4">
              <div className="col-span-2">
                <p className="font-mono text-sm font-semibold text-slate-900">{c.claim_number}</p>
                <p className="text-xs text-slate-400">{c.service_date}</p>
              </div>
              <div className="col-span-3">
                <p className="truncate text-sm font-medium text-slate-800">{c.beneficiary?.full_name || 'Unknown'}</p>
                <p className="truncate text-xs text-slate-400">{c.provider?.name || 'Unknown provider'}</p>
              </div>
              <div className="col-span-2"><p className="text-sm text-slate-700">{c.service_type}</p><p className="truncate text-xs text-slate-400">{c.diagnosis}</p></div>
              <div className="col-span-2"><p className="text-sm font-semibold text-slate-900">{RWF(c.total_amount)}</p><p className="text-xs text-slate-400">covers {RWF(c.covered_amount)}</p></div>
              <div className="col-span-1">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${c.fraud_score >= 60 ? 'bg-rose-100 text-rose-700' : c.fraud_score >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.fraud_score}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between"><Badge value={c.status} /><ChevronRight className="hidden h-4 w-4 text-slate-300 md:block" /></div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
