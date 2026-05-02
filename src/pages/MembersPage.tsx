import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { RoleGate } from '../components/RoleGate';
import { expiryLabel, formatDate, todayISODate } from '../lib/dates';
import { supabase } from '../lib/supabase';
import type { Gender, Member, MemberStatus } from '../types/database';

const blankMember = {
  full_name: '',
  phone: '',
  email: '',
  address: '',
  gender: 'male' as Gender,
  join_date: todayISODate(),
  membership_type: 'Monthly',
  membership_start_date: todayISODate(),
  membership_expiry_date: todayISODate(),
  emergency_contact: '',
  notes: '',
  status: 'active' as MemberStatus,
  photo_url: '',
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | MemberStatus>('active');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(blankMember);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const visible = useMemo(() => {
    return members.filter((member) => {
      const matchesQuery = `${member.full_name} ${member.phone}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'all' || member.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, members, query]);

  async function loadMembers() {
    setLoading(true);
    const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setMembers(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(blankMember);
    setPhotoFile(null);
    setOpen(true);
  }

  function openEdit(member: Member) {
    setEditing(member);
    setForm({
      full_name: member.full_name,
      phone: member.phone,
      email: member.email ?? '',
      address: member.address ?? '',
      gender: member.gender,
      join_date: member.join_date,
      membership_type: member.membership_type,
      membership_start_date: member.membership_start_date,
      membership_expiry_date: member.membership_expiry_date,
      emergency_contact: member.emergency_contact ?? '',
      notes: member.notes ?? '',
      status: member.status,
      photo_url: member.photo_url ?? '',
    });
    setPhotoFile(null);
    setOpen(true);
  }

  async function saveMember(event: FormEvent) {
    event.preventDefault();
    let photoUrl = form.photo_url || null;
    if (photoFile) {
      const extension = photoFile.name.split('.').pop() ?? 'jpg';
      const path = `${editing?.id ?? 'new'}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('member-photos').upload(path, photoFile, { upsert: false });
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from('member-photos').getPublicUrl(path);
      photoUrl = data.publicUrl;
    }
    const payload = {
      ...form,
      email: form.email || null,
      address: form.address || null,
      emergency_contact: form.emergency_contact || null,
      notes: form.notes || null,
      photo_url: photoUrl,
    };
    const request = editing
      ? supabase.from('members').update(payload).eq('id', editing.id)
      : supabase.from('members').insert(payload);
    const { error } = await request;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? 'Member updated' : 'Member added');
    setOpen(false);
    loadMembers();
  }

  async function deleteMember(member: Member) {
    if (!confirm(`Delete ${member.full_name}? This cannot be undone.`)) return;
    const { error } = await supabase.from('members').delete().eq('id', member.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Member deleted');
      loadMembers();
    }
  }

  return (
    <div className="space-y-5 md:ml-60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Members</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Search, add, and renew quickly.</p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus size={20} /> Add
        </Button>
      </div>

      <div className="mobile-card space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className="field pl-12" placeholder="Search name or phone" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['active', 'inactive', 'all'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`min-h-11 rounded-lg text-sm font-black capitalize ${filter === item ? 'bg-slate-950 text-limefit dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        {visible.map((member) => {
          const expiry = expiryLabel(member.membership_expiry_date);
          return (
            <article key={member.id} className="mobile-card">
              <div className="flex gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
                  {member.photo_url ? <img src={member.photo_url} alt="" className="h-full w-full rounded-lg object-cover" /> : <UserRound size={28} />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/members/${member.id}`} className="block truncate text-lg font-black">
                    {member.full_name}
                  </Link>
                  <p className="text-sm font-semibold text-slate-500">{member.phone}</p>
                  <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">Expiry {formatDate(member.membership_expiry_date)}</p>
                </div>
                <span className={`h-fit rounded-full px-3 py-1 text-xs font-black ${expiry.tone === 'danger' ? 'bg-red-100 text-red-700' : expiry.tone === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {expiry.label}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="ghost" onClick={() => openEdit(member)}>
                  Edit
                </Button>
                <RoleGate allow={['admin']}>
                  <Button variant="danger" onClick={() => deleteMember(member)}>
                    <Trash2 size={18} /> Delete
                  </Button>
                </RoleGate>
              </div>
            </article>
          );
        })}
      </section>

      {!loading && !visible.length && <EmptyState icon={UserRound} title="No members found" body="Add your first member or change the search filter." />}

      <Modal title={editing ? 'Edit member' : 'Add member'} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={saveMember} className="space-y-4">
          <Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required />
          <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required />
          <label>
            <span className="label">Member photo</span>
            <input className="field" type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
          </label>
          <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <label className="label">Gender</label>
          <select className="field" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          <Field label="Membership type" value={form.membership_type} onChange={(value) => setForm({ ...form, membership_type: value })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" type="date" value={form.membership_start_date} onChange={(value) => setForm({ ...form, membership_start_date: value })} />
            <Field label="Expiry" type="date" value={form.membership_expiry_date} onChange={(value) => setForm({ ...form, membership_expiry_date: value })} />
          </div>
          <Field label="Emergency contact" value={form.emergency_contact} onChange={(value) => setForm({ ...form, emergency_contact: value })} />
          <label className="label">Status</label>
          <select className="field" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MemberStatus })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="label">Notes</label>
          <textarea className="field min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button className="w-full" size="lg">
            Save member
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}
