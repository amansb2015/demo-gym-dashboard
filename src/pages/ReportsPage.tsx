import { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { downloadCsv } from '../lib/csv';
import { formatCurrency } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Attendance, Member, Payment } from '../types/database';

export default function ReportsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [chartView, setChartView] = useState<'daily' | 'monthly'>('monthly');

  useEffect(() => {
    Promise.all([
      supabase.from('payments').select('*, members(full_name, phone)').order('paid_at', { ascending: false }),
      supabase.from('members').select('*'),
      supabase.from('attendance').select('*').order('check_in_at', { ascending: false }),
    ]).then(([paymentResult, memberResult, attendanceResult]) => {
      setPayments((paymentResult.data ?? []) as unknown as Payment[]);
      setMembers(memberResult.data ?? []);
      setAttendance(attendanceResult.data ?? []);
    });
  }, []);

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();

    payments.forEach((payment) => {
      const date = new Date(payment.paid_at);

      if (chartView === 'daily') {
        const day = date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        totals.set(day, (totals.get(day) ?? 0) + Number(payment.amount));
      } else {
        const month = date.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit',
        });

        totals.set(month, (totals.get(month) ?? 0) + Number(payment.amount));
      }
    });

    return Array.from(totals.entries()).map(([label, revenue]) => ({
      label,
      revenue,
    }));
  }, [payments, chartView]);

  const methodSplit = [
    { name: 'Cash', value: payments.filter((payment) => payment.method === 'cash').length, color: '#f97316' },
    { name: 'Online', value: payments.filter((payment) => payment.method === 'online').length, color: '#10b981' },
  ];

  const activeCount = members.filter((member) => member.status === 'active').length;
  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="space-y-5 px-4 pt-6 pb-24 md:ml-60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">Reports</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Admin analytics and exports.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setChartView('daily')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${chartView === 'daily'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-700'
              }`}
          >
            Daily
          </button>

          <button
            onClick={() => setChartView('monthly')}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${chartView === 'monthly'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-700'
              }`}
          >
            Monthly
          </button>
          <div className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                downloadCsv(
                  'gymflow-payments.csv',
                  payments.map((payment) => ({
                    receipt: payment.receipt_id,
                    member: payment.members?.full_name,
                    amount: payment.amount,
                    method: payment.method,
                    paid_at: payment.paid_at,
                  }))
                )
              }
            >
              <Download size={18} /> CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Revenue" value={formatCurrency(revenue)} icon={FileText} />
          <StatCard title="Payments" value={payments.length} icon={FileText} tone="green" />
          <StatCard title="Active" value={activeCount} icon={FileText} tone="slate" />
          <StatCard title="Visits" value={attendance.length} icon={FileText} tone="orange" />
        </div>

        <section className="mobile-card overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Revenue Analytics
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Monthly revenue growth overview
              </p>
            </div>

            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              LIVE
            </div>
          </div>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e2e8f0"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                />

                <YAxis
                  width={50}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `₹${value}`}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                  }}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Revenue',
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={4}
                  fill="url(#revenueGradient)"
                  animationDuration={2200}
                  animationEasing="ease-in-out"
                  activeDot={{
                    r: 7,
                    strokeWidth: 0,
                    fill: '#10b981',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="mobile-card">
            <h2 className="text-lg font-black">Payment method split</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodSplit} dataKey="value" nameKey="name" outerRadius={78} label>
                    {methodSplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mobile-card">
            <h2 className="text-lg font-black">Active vs inactive</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
                <p className="text-sm font-black">Active</p>
                <p className="mt-2 text-4xl font-black">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-4 text-slate-800">
                <p className="text-sm font-black">Inactive</p>
                <p className="mt-2 text-4xl font-black">{members.length - activeCount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-500 dark:border-slate-700">
              PDF export placeholder: wire this to an Edge Function or client PDF renderer when final invoices/reports are needed.
            </div>
          </div>
        </section>
      </div>
      </div>);
}
