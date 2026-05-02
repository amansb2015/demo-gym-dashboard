import { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

  const monthly = useMemo(() => {
    const totals = new Map<string, number>();
    payments.forEach((payment) => {
      const month = new Date(payment.paid_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      totals.set(month, (totals.get(month) ?? 0) + Number(payment.amount));
    });
    return Array.from(totals.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [payments]);

  const methodSplit = [
    { name: 'Cash', value: payments.filter((payment) => payment.method === 'cash').length, color: '#f97316' },
    { name: 'Online', value: payments.filter((payment) => payment.method === 'online').length, color: '#10b981' },
  ];

  const activeCount = members.filter((member) => member.status === 'active').length;
  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="space-y-5 md:ml-60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Reports</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Admin analytics and exports.</p>
        </div>
        <Button onClick={() => downloadCsv('gymflow-payments.csv', payments.map((payment) => ({ receipt: payment.receipt_id, member: payment.members?.full_name, amount: payment.amount, method: payment.method, paid_at: payment.paid_at })))}>
          <Download size={18} /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Revenue" value={formatCurrency(revenue)} icon={FileText} />
        <StatCard title="Payments" value={payments.length} icon={FileText} tone="green" />
        <StatCard title="Active" value={activeCount} icon={FileText} tone="slate" />
        <StatCard title="Visits" value={attendance.length} icon={FileText} tone="orange" />
      </div>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Monthly revenue</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#84cc16" radius={[8, 8, 0, 0]} />
            </BarChart>
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
  );
}
