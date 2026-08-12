import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Spinner, ErrorState } from '../components/ui';
import PageHeader from '../components/PageHeader';

interface Entry { id: number; action: string; entity: string; entity_id: string; actor: string; details: string; created_at: string; }

export default function AuditLog() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api<Entry[]>('/api/audit');
      setRows(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await load(); })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Audit Log" subtitle="Immutable trail for transparency & accountability" />
      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <Card className="overflow-hidden">
          {rows.length === 0 ? <p className="px-5 py-12 text-center text-sm text-slate-400">No audit entries yet.</p> : (
            <ol className="relative">
              {rows.map((r) => (
                <li key={r.id} className="flex gap-4 border-b border-slate-50 px-5 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"><ScrollText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-semibold text-white">{r.action}</span>
                      <span className="text-sm text-slate-700">{r.details}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{r.actor} · {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}
    </div>
  );
}
