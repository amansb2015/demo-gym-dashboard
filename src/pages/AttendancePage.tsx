import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, QrCode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateTime, isToday } from '../lib/dates';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import type { Attendance, Member } from '../types/database';

export default function AttendancePage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<Attendance[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => members.filter((member) => `${member.full_name} ${member.phone}`.toLowerCase().includes(query.toLowerCase())), [members, query]);
  const checkedToday = useMemo(() => new Set(logs.filter((log) => isToday(log.check_in_at)).map((log) => log.member_id)), [logs]);

  async function loadData() {
    const [memberResult, logResult] = await Promise.all([
      supabase.from('members').select('*').eq('status', 'active').order('full_name'),
      supabase.from('attendance').select('*, members(full_name, phone)').order('check_in_at', { ascending: false }).limit(60),
    ]);
    setMembers(memberResult.data ?? []);
    setLogs((logResult.data ?? []) as unknown as Attendance[]);
  }

  async function checkIn(member: Member) {
    if (checkedToday.has(member.id)) {
      toast.info(`${member.full_name} is already checked in today`);
      return;
    }
    const { error } = await supabase.from('attendance').insert({
      member_id: member.id,
      check_in_at: new Date().toISOString(),
      marked_by: user?.id ?? null,
      notes: null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`${member.full_name} checked in`);
      loadData();
    }
  }

  return (
    <div className="space-y-5 md:ml-60">
      <div>
        <h1 className="text-3xl font-black">Attendance</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Tap once when a member enters.</p>
      </div>
      <div className="mobile-card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className="field pl-12" placeholder="Search active member" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <section className="grid gap-3 lg:grid-cols-2">
        {filtered.map((member) => (
          <article key={member.id} className="mobile-card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{member.full_name}</p>
              <p className="text-sm font-semibold text-slate-500">{member.phone}</p>
            </div>
            <Button variant={checkedToday.has(member.id) ? 'ghost' : 'primary'} onClick={() => checkIn(member)}>
              <CalendarCheck size={19} /> {checkedToday.has(member.id) ? 'Done' : 'Check in'}
            </Button>
          </article>
        ))}
      </section>
      {!filtered.length && <EmptyState icon={CalendarCheck} title="No active members" body="Active members show here for quick check-in." />}

      <section className="mobile-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Today and recent</h2>
          <Button variant="ghost" size="sm" type="button" title="QR check-in placeholder">
            <QrCode size={18} /> QR
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-black">{log.members?.full_name ?? 'Member'}</p>
              <p className="text-sm font-bold text-slate-500">{formatDateTime(log.check_in_at)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
