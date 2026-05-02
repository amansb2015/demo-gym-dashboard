import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  if (user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('gymflow-remember', remember ? 'true' : 'false');
      await signIn(email, password);
      toast.success('Welcome back');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 py-8">
        <div className="pt-8">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-limefit text-slate-950 shadow-soft">
            <Dumbbell size={34} />
          </div>
          <h1 className="mt-8 text-4xl font-black leading-tight">Run your gym from your phone.</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">Secure admin and staff login for members, payments, attendance, and renewals.</p>
        </div>

        <form onSubmit={submit} className="mb-4 rounded-lg bg-white p-4 text-slate-950 shadow-soft">
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm font-semibold text-orange-800">
              Add Supabase environment variables before logging in.
            </div>
          )}
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <label className="label mt-4" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              className="field pr-12"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <label className="mt-4 flex min-h-12 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-bold">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-5 w-5 accent-limefit" />
            Remember this device
          </label>
          <Button className="mt-5 w-full" size="lg" disabled={loading}>
            <Lock size={20} /> {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
