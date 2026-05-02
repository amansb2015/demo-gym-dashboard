import { useEffect, useMemo, useState } from 'react';
import { addDays, startOfMonth, startOfToday } from 'date-fns';
import { AlertCircle, CalendarClock, CreditCard, IndianRupee, ReceiptText, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { StatCard } from '../components/ui/StatCard';
import { RoleGate } from '../components/RoleGate';
import { formatCurrency, formatDate, formatDateTime } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Attendance, Member, Payment } from '../types/database';

type DashboardState = {
  activeMembers: number;
  todayCollection: number;
  monthlyRevenue: number;
  cashCount: number;
  onlineCount: number;
  expiring: Member[];
  expired: Member[];
  payments: Payment[];
  attendance: Attendance[];
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DashboardState>({
    activeMembers: 0,
    todayCollection: 0,
    monthlyRevenue: 0,
    cashCount: 0,
    onlineCount: 0,
    expiring: [],
    expired: [],
    payments: [],
    attendance: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();

    state.payments.forEach((payment) => {
      const date = new Date(payment.paid_at);

      const dayKey = date.toISOString().split('T')[0];

      totals.set(
        dayKey,
        (totals.get(dayKey) ?? 0) + Number(payment.amount)
      );
    });

    return Array.from(totals.entries())
      .sort(
        (a, b) =>
          new Date(a[0]).getTime() - new Date(b[0]).getTime()
      )
      .map(([date, revenue]) => ({
        day: new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        }),
        revenue,
      }));
  }, [state.payments]);

  async function loadDashboard() {
    setLoading(true);
    const today = startOfToday().toISOString();
    const month = startOfMonth(new Date()).toISOString();
    const inSevenDays = addDays(new Date(), 7).toISOString().slice(0, 10);
    const todayDate = new Date().toISOString().slice(0, 10);

    const [active, todayPayments, monthPayments, expiring, expired, recentPayments, recentAttendance] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('*').gte('paid_at', today),
      supabase.from('payments').select('*').gte('paid_at', month),
      supabase.from('members').select('*').eq('status', 'active').gte('membership_expiry_date', todayDate).lte('membership_expiry_date', inSevenDays).order('membership_expiry_date'),
      supabase.from('members').select('*').eq('status', 'active').lt('membership_expiry_date', todayDate).order('membership_expiry_date'),
      supabase.from('payments').select('*, members(full_name, phone), profiles(full_name)').order('paid_at', { ascending: false }).limit(12),
      supabase.from('attendance').select('*, members(full_name, phone)').order('check_in_at', { ascending: false }).limit(8),
    ]);

    setState({
      activeMembers: active.count ?? 0,
      todayCollection: (todayPayments.data ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0),
      monthlyRevenue: (monthPayments.data ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0),
      cashCount: (monthPayments.data ?? []).filter((payment) => payment.method === 'cash').length,
      onlineCount: (monthPayments.data ?? []).filter((payment) => payment.method === 'online').length,
      expiring: expiring.data ?? [],
      expired: expired.data ?? [],
      payments: (recentPayments.data ?? []) as unknown as Payment[],
      attendance: (recentAttendance.data ?? []) as unknown as Attendance[],
    });
    setLoading(false);
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 md:ml-60">
      <section className="rounded-lg bg-slate-950 p-5 text-white shadow-soft dark:bg-slate-900">
        <p className="text-sm font-extrabold uppercase text-limefit">Today</p>
        <h1 className="mt-2 text-3xl font-black">Quick gym overview</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Members, collections, check-ins, and renewals in one pocket-friendly view.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Active members" value={state.activeMembers} icon={Users} />
        <RoleGate allow={['admin']}>
          <StatCard title="Today" value={formatCurrency(state.todayCollection)} icon={IndianRupee} tone="green" />
          <StatCard title="This month" value={formatCurrency(state.monthlyRevenue)} icon={ReceiptText} tone="slate" />
          <StatCard title="Cash count" value={state.cashCount} icon={CreditCard} tone="orange" />
          <StatCard title="Online count" value={state.onlineCount} icon={CreditCard} tone="green" />
        </RoleGate>
        <StatCard title="Expiring" value={state.expiring.length} icon={CalendarClock} tone="orange" sub="Next 7 days" />
        <StatCard title="Overdue" value={state.expired.length} icon={AlertCircle} tone="red" />
      </div>

      <RoleGate allow={['admin']}>
        <section className="mobile-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Revenue trend</h2>
              <p className="text-sm font-semibold text-slate-500">Recent payments</p>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black dark:bg-slate-800">
              Cash {state.cashCount} · Online {state.onlineCount}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="linear" dataKey="revenue" stroke="#059669" strokeWidth={3} fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </RoleGate>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="mobile-card">
          <h2 className="text-lg font-black">Renewals</h2>
          <div className="mt-4 space-y-3">
            {[...state.expired, ...state.expiring].slice(0, 6).map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <div>
                  <p className="font-extrabold">{member.full_name}</p>
                  <p className="text-sm text-slate-500">Expires {formatDate(member.membership_expiry_date)}</p>
                </div>
                <CreditCard size={20} className="text-lime-600" />
              </div>
            ))}
            {!state.expiring.length && !state.expired.length && <EmptyState icon={CalendarClock} title="No renewals pending" body="Everyone is currently covered." />}
          </div>
        </div>

        <div className="mobile-card">
          <h2 className="text-lg font-black">Recent payments</h2>
          <div className="mt-4 space-y-3">
            {state.payments.slice(0, 6).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <div>
                  <p className="font-extrabold">{payment.members?.full_name ?? 'Member'}</p>
                  <p className="text-sm text-slate-500">{formatDateTime(payment.paid_at)}</p>
                </div>
                <p className="font-black">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
            {!state.payments.length && <EmptyState icon={ReceiptText} title="No payments yet" body="Payments will appear here after staff logs them." />}
          </div>
        </div>
      </section>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Recent attendance</h2>
        <div className="mt-4 space-y-3">
          {state.attendance.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-extrabold">{row.members?.full_name ?? 'Member'}</p>
              <p className="text-sm font-bold text-slate-500">{formatDateTime(row.check_in_at)}</p>
            </div>
          ))}
          {!state.attendance.length && <EmptyState icon={Users} title="No check-ins yet" body="Tap attendance to start marking visits." />}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 md:ml-60">
      <Skeleton className="h-36" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
