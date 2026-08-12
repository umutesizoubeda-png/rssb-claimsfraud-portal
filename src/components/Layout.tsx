import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, FileText, ShieldAlert, Building2, Users, ScrollText,
  PlusCircle, LogOut, Menu, X, BarChart3,
} from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../lib/types';

const NAV: { to: string; label: string; icon: React.ElementType; roles: Role[] }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'provider', 'investigator', 'analyst'] },
  { to: '/submit', label: 'Submit Claim', icon: PlusCircle, roles: ['admin', 'provider'] },
  { to: '/claims', label: 'Claims', icon: FileText, roles: ['admin', 'provider', 'investigator', 'analyst'] },
  { to: '/fraud', label: 'Fraud Center', icon: ShieldAlert, roles: ['admin', 'investigator', 'analyst'] },
  { to: '/providers', label: 'Providers', icon: Building2, roles: ['admin', 'investigator', 'analyst'] },
  { to: '/beneficiaries', label: 'Beneficiaries', icon: Users, roles: ['admin', 'investigator', 'analyst'] },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'investigator', 'analyst'] },
  { to: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['admin', 'investigator'] },
  // Export Code removed from navigation
];

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  provider: 'Healthcare Provider',
  investigator: 'Fraud Investigator',
  analyst: 'Claims Analyst',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = profile?.role || 'analyst';
  const items = NAV.filter((n) => n.roles.includes(role));

  const signOut = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
          <span className="text-[11px] font-extrabold tracking-tight text-slate-950">RSSB</span>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>RSSB Health Insurance</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-emerald-400">Claims &amp; Fraud Detection</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <n.icon className="h-[18px] w-[18px]" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-emerald-300">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 bg-slate-900 lg:block">{SidebarContent}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <span className="text-[10px] font-extrabold tracking-tight text-slate-950">RSSB</span>
            </div>
            <span className="font-bold text-slate-900">RSSB Claims &amp; Fraud Detection Portal</span>
          </div>
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
