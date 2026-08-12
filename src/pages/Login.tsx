import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import supabase from '../lib/supabase';
import { signInWithGoogle } from '../lib/googleAuth';

const DEMOS = [
  { label: 'Administrator', email: 'admin@rssb.rw', desc: 'Full system access & audit' },
  { label: 'Healthcare Provider', email: 'provider@rssb.rw', desc: 'Submits & tracks claims' },
  { label: 'Fraud Investigator', email: 'investigator@rssb.rw', desc: 'Reviews flagged claims' },
  { label: 'Claims Analyst', email: 'analyst@rssb.rw', desc: 'Verifies & reimburses' },
];

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const fn = isSignUp
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });
      const { error } = await fn;
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => { setEmail(demoEmail); setPassword('rssb2026'); setError(''); };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-12 lg:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <span className="text-sm font-extrabold tracking-tight">RSSB</span>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>RSSB Health Insurance</p>
            <p className="text-xs text-emerald-100">Claims &amp; Fraud Detection Portal</p>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Automated health insurance claims, powered by AI fraud detection.
          </h1>
          <p className="mt-4 max-w-md text-emerald-100">
            Electronic submission, eligibility verification, approval workflows and
            real-time anomaly detection — built for insurers across Rwanda.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-emerald-100">
            <ShieldCheck className="h-5 w-5" /> Random Forest &amp; Isolation Forest scoring on every claim
          </div>
        </div>
        <p className="relative text-xs text-emerald-200/80">Secured with JWT authentication &amp; role-based access control.</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500"><span className="text-[11px] font-extrabold tracking-tight text-slate-950">RSSB</span></div>
              <span className="text-base font-bold">RSSB Claims &amp; Fraud Detection Portal</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{isSignUp ? 'Create account' : 'Welcome back'}</h2>
          <p className="mt-1 text-sm text-slate-400">{isSignUp ? 'Register to access the platform.' : 'Sign in to your dashboard.'}</p>

          {error && <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="officer@rssb.rw" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign up' : 'Sign in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><div className="h-px flex-1 bg-slate-800" />or<div className="h-px flex-1 bg-slate-800" /></div>

          <button onClick={() => signInWithGoogle('RSSB Claims & Fraud Detection Portal')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75z"/></svg>
            Continue with Google
          </button>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <p className="mb-2.5 text-xs font-medium text-slate-400">Demo personas (password: <span className="font-mono text-emerald-300">password123</span>)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map((d) => (
                <button key={d.email} onClick={() => fillDemo(d.email)}
                  className="rounded-lg bg-slate-800 px-2.5 py-2 text-left transition hover:bg-slate-700">
                  <span className="block text-xs font-semibold text-emerald-300">{d.label}</span>
                  <span className="block text-[10px] text-slate-400">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-semibold text-emerald-400 hover:underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
