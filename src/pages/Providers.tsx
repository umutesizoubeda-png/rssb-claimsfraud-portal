import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Spinner, ErrorState, Badge, RiskMeter } from '../components/ui';
import PageHeader from '../components/PageHeader';
import type { Provider } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

// Admin-only: add provider modal state
import { useMemo } from 'react';

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { profile } = useAuth();

  // Add Provider modal state
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', type: '', district: '', risk_score: 5, risk_level: 'low' });

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
      <div className="flex items-center justify-between gap-4 mb-6">
        <PageHeader title="Providers" subtitle="Healthcare facilities & their fraud risk profiles" />
        {profile?.role === 'admin' && (
          <button onClick={() => setIsOpen(true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-white text-sm font-semibold">Add Provider</button>
        )}
      </div>
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

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Add New Provider</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault(); setSubmitting(true);
              try {
                await api('/api/providers', { method: 'POST', headers: { 'X-User-Email': profile?.email || '' }, body: JSON.stringify({ ...formData, risk_score: Number(formData.risk_score) }) });
                setIsOpen(false);
                setFormData({ name: '', code: '', type: '', district: '', risk_score: 5, risk_level: 'low' });
                // reload providers
                api<Provider[]>('/api/providers').then(setProviders).catch((e) => setError(e.message));
              } catch (err) {
                alert(`Failed to add provider: ${err instanceof Error ? err.message : 'Unknown error'}`);
              } finally { setSubmitting(false); }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input required placeholder="Provider name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border px-3 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Code</label>
                <input required placeholder="Unique code (e.g. PRV-001)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full border px-3 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border px-3 py-2 rounded-xl">
                  <option value="">Select type</option>
                  <option value="Hospital">Hospital</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
                <input required placeholder="District (e.g. Kigali)" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full border px-3 py-2 rounded-xl" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Risk score</label>
                  <input type="number" min={0} max={100} required value={formData.risk_score} onChange={(e) => setFormData({ ...formData, risk_score: Number(e.target.value) })} className="w-full border px-3 py-2 rounded-xl" />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Risk level</label>
                  <select value={formData.risk_level} onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })} className="w-full border px-3 py-2 rounded-xl">
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
