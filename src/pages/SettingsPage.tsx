import { FormEvent, useEffect, useState } from 'react';
import { Moon, Plus, Shield, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { RoleGate } from '../components/RoleGate';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import type { GymSettings, MembershipPlan, Profile, UserRole } from '../types/database';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [gymName, setGymName] = useState('GymFlow Gym');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [newPlan, setNewPlan] = useState({ name: '', duration_days: '30', price: '' });
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const [settingsResult, plansResult, staffResult] = await Promise.all([
      supabase.from('gym_settings').select('*').limit(1).maybeSingle(),
      supabase.from('membership_plans').select('*').order('price'),
      isAdmin ? supabase.from('profiles').select('*').order('created_at') : Promise.resolve({ data: [] as Profile[] }),
    ]);
    setSettings(settingsResult.data);
    setGymName(settingsResult.data?.gym_name ?? 'GymFlow Gym');
    setPlans(plansResult.data ?? []);
    setStaff(staffResult.data ?? []);
  }

  async function saveGym(event: FormEvent) {
    event.preventDefault();
    let logoUrl = settings?.logo_url ?? null;
    if (logoFile) {
      const extension = logoFile.name.split('.').pop() ?? 'png';
      const path = `logos/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('gym-assets').upload(path, logoFile, { upsert: false });
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from('gym-assets').getPublicUrl(path);
      logoUrl = data.publicUrl;
    }
    const payload = { gym_name: gymName, theme: settings?.theme ?? 'system', logo_url: logoUrl };
    const request = settings?.id ? supabase.from('gym_settings').update(payload).eq('id', settings.id) : supabase.from('gym_settings').insert(payload);
    const { error } = await request;
    if (error) toast.error(error.message);
    else {
      toast.success('Settings saved');
      loadSettings();
    }
  }

  async function addPlan(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.from('membership_plans').insert({
      name: newPlan.name,
      duration_days: Number(newPlan.duration_days),
      price: Number(newPlan.price),
      is_active: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Plan added');
      setNewPlan({ name: '', duration_days: '30', price: '' });
      loadSettings();
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success('Password changed');
      setPassword('');
    }
  }

  async function updateRole(id: string, role: UserRole) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Role updated');
      loadSettings();
    }
  }

  function setTheme(theme: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('gymflow-theme', theme);
  }

  return (
    <div className="space-y-5 md:ml-60">
      <div>
        <h1 className="text-3xl font-black">Settings</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Gym details, staff, plans, and app preferences.</p>
      </div>

      <form onSubmit={saveGym} className="mobile-card space-y-4">
        <h2 className="text-lg font-black">Gym profile</h2>
        <label>
          <span className="label">Gym name</span>
          <input className="field" value={gymName} onChange={(event) => setGymName(event.target.value)} />
        </label>
        <label>
          <span className="label">Gym logo</span>
          <input className="field" type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
        </label>
        <Button className="w-full">Save gym</Button>
      </form>

      <section className="mobile-card">
        <h2 className="text-lg font-black">App theme</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => setTheme('light')}>
            <Sun size={19} /> Light
          </Button>
          <Button variant="secondary" onClick={() => setTheme('dark')}>
            <Moon size={19} /> Dark
          </Button>
        </div>
      </section>

      <form onSubmit={addPlan} className="mobile-card space-y-4">
        <h2 className="text-lg font-black">Membership plans</h2>
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div>
                <p className="font-black">{plan.name}</p>
                <p className="text-sm font-semibold text-slate-500">{plan.duration_days} days</p>
              </div>
              <p className="font-black">₹{plan.price}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <input className="field" placeholder="Name" value={newPlan.name} onChange={(event) => setNewPlan({ ...newPlan, name: event.target.value })} required />
          <input className="field" placeholder="Days" inputMode="numeric" value={newPlan.duration_days} onChange={(event) => setNewPlan({ ...newPlan, duration_days: event.target.value })} required />
          <input className="field" placeholder="Price" inputMode="decimal" value={newPlan.price} onChange={(event) => setNewPlan({ ...newPlan, price: event.target.value })} required />
        </div>
        <Button className="w-full">
          <Plus size={18} /> Add plan
        </Button>
      </form>

      <RoleGate allow={['admin']}>
        <section className="mobile-card">
          <h2 className="text-lg font-black">Staff management</h2>
          <div className="mt-4 space-y-3">
            {staff.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <div className="min-w-0">
                  <p className="truncate font-black">{person.full_name ?? person.id}</p>
                  <p className="text-sm font-bold text-slate-500">{person.role}</p>
                </div>
                <select className="field max-w-32" value={person.role} onChange={(event) => updateRole(person.id, event.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      </RoleGate>

      <form onSubmit={changePassword} className="mobile-card space-y-4">
        <h2 className="text-lg font-black">Change password</h2>
        <label>
          <span className="label">New password</span>
          <input className="field" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <Button className="w-full" variant="secondary">
          <Shield size={18} /> Update password
        </Button>
      </form>
    </div>
  );
}
