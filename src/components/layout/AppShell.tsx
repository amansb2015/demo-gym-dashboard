import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, CalendarCheck, CreditCard, Home, LogOut, Settings, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { useAuth } from '../../providers/AuthProvider';

const navItems = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Members', path: '/members', icon: Users },
  { label: 'Pay', path: '/payments', icon: CreditCard },
  { label: 'Check-in', path: '/attendance', icon: CalendarCheck },
  { label: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, isAdmin } = useAuth();
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen safe-top safe-bottom bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-slate-50/80 px-4 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate('/dashboard')}>
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-limefit dark:bg-white dark:text-slate-950">
              <Activity size={23} />
            </div>
            <div>
              <p className="text-lg font-black leading-none">GymFlow</p>
              <p className="mt-1 text-xs font-bold uppercase text-slate-500">{profile?.role ?? 'secure'}</p>
            </div>
          </button>
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Logout">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="safe-bottom mx-auto w-full max-w-6xl px-4 py-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <div className="mx-auto grid max-w-md grid-flow-col auto-cols-fr gap-1">
          {visibleItems.slice(0, 5).map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-extrabold transition',
                  active ? 'bg-slate-950 text-limefit dark:bg-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                <Icon size={21} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <aside className="fixed left-4 top-24 hidden w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
        {visibleItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'mb-1 flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-extrabold',
                active ? 'bg-slate-950 text-limefit dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <Icon size={19} /> {item.label}
            </button>
          );
        })}
      </aside>
    </div>
  );
}
