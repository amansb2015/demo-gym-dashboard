import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, CreditCard, UserRound } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, formatDateTime } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Attendance, Member, Payment } from '../types/database';

export default function MemberDetailPage() {
  const { id } = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('members').select('*').eq('id', id).single(),
      supabase.from('payments').select('*').eq('member_id', id).order('paid_at', { ascending: false }),
      supabase.from('attendance').select('*').eq('member_id', id).order('check_in_at', { ascending: false }),
    ]).then(([memberResult, paymentResult, attendanceResult]) => {
      setMember(memberResult.data);
      setPayments(paymentResult.data ?? []);
      setAttendance(attendanceResult.data ?? []);
    });
  }, [id]);

  if (!member) {
    return (
      <div className="md:ml-60">
        <EmptyState icon={UserRound} title="Member not found" body="This member may have been removed." />
      </div>
    );
  }

  return (
    <div className="space-y-5 md:ml-60">
      <Link to="/members">
        <Button variant="ghost">
          <ArrowLeft size={18} /> Back
        </Button>
      </Link>
      <section className="mobile-card">
        <div className="flex gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
            {member.photo_url ? <img src={member.photo_url} alt="" className="h-full w-full rounded-lg object-cover" /> : <UserRound size={38} />}
          </div>
          <div>
            <h1 className="text-3xl font-black">{member.full_name}</h1>
            <p className="mt-1 font-bold text-slate-500">{member.phone}</p>
            <p className="mt-2 rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-800">{member.status}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Info label="Plan" value={member.membership_type} />
          <Info label="Joined" value={formatDate(member.join_date)} />
          <Info label="Start" value={formatDate(member.membership_start_date)} />
          <Info label="Expiry" value={formatDate(member.membership_expiry_date)} />
          <Info label="Emergency" value={member.emergency_contact ?? 'Not set'} />
          <Info label="Email" value={member.email ?? 'Not set'} />
        </div>
        {member.notes && <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{member.notes}</p>}
      </section>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Membership history</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-lime-50 p-3 text-lime-900">
            <p className="font-black">{member.membership_type}</p>
            <p className="text-sm font-bold">
              {formatDate(member.membership_start_date)} to {formatDate(member.membership_expiry_date)}
            </p>
          </div>
          {payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-black">Payment renewal · {formatCurrency(payment.amount)}</p>
              <p className="text-sm font-semibold text-slate-500">{formatDateTime(payment.paid_at)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Payment history</h2>
        <div className="mt-4 space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <div>
                <p className="font-black">{formatCurrency(payment.amount)}</p>
                <p className="text-sm font-semibold text-slate-500">{formatDateTime(payment.paid_at)} · {payment.method}</p>
              </div>
              <CreditCard className="text-lime-600" size={20} />
            </div>
          ))}
          {!payments.length && <EmptyState icon={CreditCard} title="No payments" body="Payment records for this member will appear here." />}
        </div>
      </section>

      <section className="mobile-card">
        <h2 className="text-lg font-black">Attendance history</h2>
        <div className="mt-4 space-y-3">
          {attendance.slice(0, 20).map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-bold">{formatDateTime(row.check_in_at)}</p>
              <CalendarCheck className="text-emerald-600" size={20} />
            </div>
          ))}
          {!attendance.length && <EmptyState icon={CalendarCheck} title="No visits" body="Attendance history starts when the member checks in." />}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-extrabold">{value}</p>
    </div>
  );
}
