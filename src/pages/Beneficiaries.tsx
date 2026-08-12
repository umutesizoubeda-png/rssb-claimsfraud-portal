import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Spinner, ErrorState, Badge } from '../components/ui';
import PageHeader from '../components/PageHeader';
import type { Beneficiary } from '../lib/types';

export default function Beneficiaries() {
  const [rows, setRows] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal & Form State
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    full_name: '',
    national_id: '',
    scheme: 'RSSB / Mutuelle',
    coverage_percent: 85,
    valid_until: '',
    district: 'Kigali',
    status: 'active',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const res = await api<Beneficiary[]>('/api/beneficiaries');
        if (mounted) setRows(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          coverage_percent: Number(formData.coverage_percent),
        }),
      });

      // Close modal & reset form
      setIsOpen(false);
      setFormData({
        member_id: '',
        full_name: '',
        national_id: '',
        scheme: 'RSSB / Mutuelle',
        coverage_percent: 85,
        valid_until: '',
        district: 'Kigali',
        status: 'active',
      });

      // Re-fetch list smoothly
      load();
    } catch (err) {
      alert(`Failed to add beneficiary: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((b) => 
      b.full_name.toLowerCase().includes(q) || 
      b.member_id.toLowerCase().includes(q) || 
      b.scheme.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader title="Beneficiaries" subtitle={`${rows.length} insured members`} />
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          {/* Plus Icon (Inline SVG) */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Beneficiary
        </button>
      </div>

      {/* Search Input */}
      <Card className="mb-4 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search by name, member ID or scheme…"
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
          />
        </div>
      </Card>

      {/* Table & Data Display */}
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <div className="col-span-4">Member</div>
            <div className="col-span-3">Scheme</div>
            <div className="col-span-2">Coverage</div>
            <div className="col-span-2">Valid until</div>
            <div className="col-span-1">Status</div>
          </div>
          {filtered.map((b) => (
            <div key={b.id} className="grid grid-cols-1 gap-2 border-b border-slate-50 px-5 py-4 md:grid-cols-12 md:items-center md:gap-4">
              <div className="col-span-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">
                  {b.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.full_name}</p>
                  <p className="font-mono text-xs text-slate-400">{b.member_id}</p>
                </div>
              </div>
              <div className="col-span-3 text-sm text-slate-700">
                {b.scheme}
                <p className="text-xs text-slate-400">{b.district}</p>
              </div>
              <div className="col-span-2 text-sm font-semibold text-slate-800">{b.coverage_percent}%</div>
              <div className="col-span-2 text-sm text-slate-600">{b.valid_until}</div>
              <div className="col-span-1"><Badge value={b.status} /></div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-400">
              <Users className="h-4 w-4" /> No beneficiaries found.
            </p>
          )}
        </Card>
      )}

      {/* Add Beneficiary Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Add New Beneficiary</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {/* Close Icon (Inline SVG) */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Member ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBR-100234"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">National ID</label>
                  <input
                    type="text"
                    required
                    placeholder="16-digit NID"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marie Mugabo"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Scheme</label>
                  <select
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.scheme}
                    onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                  >
                    <option value="RSSB / Mutuelle">RSSB / Mutuelle</option>
                    <option value="RAMA / RSSB">RAMA / RSSB</option>
                    <option value="MMI">MMI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Coverage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.coverage_percent}
                    onChange={(e) => setFormData({ ...formData, coverage_percent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gasabo"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Valid Until</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}