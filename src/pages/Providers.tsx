import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Spinner, ErrorState, Badge, RiskMeter } from '../components/ui';
import PageHeader from '../components/PageHeader';
import type { Provider } from '../lib/types';

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    api<Provider[]>('/api/providers').then(setProviders).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api<Provider[]>('/api/providers');
        if (mounted) setProviders(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Providers" subtitle="Healthcare facilities & their fraud risk profiles" />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.code} · {p.type}</p>
                  </div>
                </div>
                <Badge value={p.risk_level} />
              </div>
              <p className="mt-3 text-xs text-slate-400">{p.district}</p>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between"><span className="text-xs text-slate-500">Risk score</span><RiskMeter score={p.risk_score} /></div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Claims</span>
                  <span className="font-semibold text-slate-800">{p.total_claims} total · <span className="text-rose-600">{p.flagged_claims} flagged</span></span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
