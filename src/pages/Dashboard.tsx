import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Spinner, ErrorState } from '../components/ui';
import type { DashData } from '../components/dash';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import ProviderDashboard from './dashboards/ProviderDashboard';
import InvestigatorDashboard from './dashboards/InvestigatorDashboard';
import AnalystDashboard from './dashboards/AnalystDashboard';

export default function Dashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = profile?.role || 'analyst';

  const load = () => {
    setLoading(true);
    setError('');
    // Providers only see their own claims
    const qs = role === 'provider' && profile?.provider_id ? `?provider_id=${profile.provider_id}` : '';
    api<DashData>(`/api/dashboard${qs}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const qs = role === 'provider' && profile?.provider_id ? `?provider_id=${profile.provider_id}` : '';
        const res = await api<DashData>(`/api/dashboard${qs}`);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [role, profile?.provider_id]);

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error || !data) return <div className="p-6"><ErrorState message={error || 'No data'} onRetry={load} /></div>;

  switch (role) {
    case 'admin':
      return <AdminDashboard data={data} />;
    case 'provider':
      return <ProviderDashboard data={data} name={profile?.full_name || 'Your Facility'} />;
    case 'investigator':
      return <InvestigatorDashboard data={data} />;
    default:
      return <AnalystDashboard data={data} />;
  }
}
