create extension if not exists "pgcrypto";

create type public.user_role as enum ('admin', 'staff');
create type public.member_status as enum ('active', 'inactive');
create type public.payment_method as enum ('cash', 'online');
create type public.gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'staff',
  phone text,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  address text,
  gender public.gender_type not null default 'prefer_not_to_say',
  join_date date not null default current_date,
  membership_type text not null,
  membership_start_date date not null,
  membership_expiry_date date not null,
  emergency_contact text,
  notes text,
  status public.member_status not null default 'active',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days int not null check (duration_days > 0),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  method public.payment_method not null,
  paid_at timestamptz not null default now(),
  added_by uuid references public.profiles(id) on delete set null,
  notes text,
  receipt_id text not null unique,
  screenshot_url text,
  transaction_id text,
  upi_id text,
  sender_name text,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  check_in_at timestamptz not null default now(),
  marked_by uuid references public.profiles(id) on delete set null,
  notes text
);

create table public.payment_screenshots (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  storage_path text not null,
  ocr_text text,
  created_at timestamptz not null default now()
);

create table public.gym_settings (
  id uuid primary key default gen_random_uuid(),
  gym_name text not null default 'GymFlow Gym',
  logo_url text,
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_members_status on public.members(status);
create index idx_members_expiry on public.members(membership_expiry_date);
create index idx_members_phone on public.members(phone);
create index idx_payments_paid_at on public.payments(paid_at desc);
create index idx_payments_member on public.payments(member_id);
create index idx_attendance_member_time on public.attendance(member_id, check_in_at desc);
create index idx_attendance_check_in on public.attendance(check_in_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_members_updated_at
before update on public.members
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_plans enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.payment_screenshots enable row level security;
alter table public.gym_settings enable row level security;

create policy "profiles can read own or admin reads all" on public.profiles
for select using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "admins update profiles" on public.profiles
for update using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "authenticated read members" on public.members
for select using (auth.role() = 'authenticated');

create policy "authenticated insert members" on public.members
for insert with check (auth.role() = 'authenticated');

create policy "authenticated update members" on public.members
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin delete members" on public.members
for delete using (public.current_user_role() = 'admin');

create policy "authenticated read plans" on public.membership_plans
for select using (auth.role() = 'authenticated');

create policy "admin manage plans" on public.membership_plans
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "authenticated insert payments" on public.payments
for insert with check (auth.role() = 'authenticated');

create policy "admin read all payments" on public.payments
for select using (public.current_user_role() = 'admin');

create policy "staff read own payments" on public.payments
for select using (added_by = auth.uid());

create policy "admin update payments" on public.payments
for update using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "admin delete payments" on public.payments
for delete using (public.current_user_role() = 'admin');

create policy "authenticated manage attendance" on public.attendance
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage screenshots" on public.payment_screenshots
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated read settings" on public.gym_settings
for select using (auth.role() = 'authenticated');

create policy "admin manage settings" on public.gym_settings
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

insert into storage.buckets (id, name, public)
values
  ('payment-screenshots', 'payment-screenshots', false),
  ('member-photos', 'member-photos', true),
  ('gym-assets', 'gym-assets', true)
on conflict (id) do nothing;

create policy "authenticated upload payment screenshots" on storage.objects
for insert with check (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');

create policy "authenticated read payment screenshots" on storage.objects
for select using (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');

create policy "authenticated upload member photos" on storage.objects
for insert with check (bucket_id = 'member-photos' and auth.role() = 'authenticated');

create policy "authenticated read member photos" on storage.objects
for select using (bucket_id = 'member-photos' and auth.role() = 'authenticated');

create policy "admin manage gym assets" on storage.objects
for all using (bucket_id = 'gym-assets' and public.current_user_role() = 'admin')
with check (bucket_id = 'gym-assets' and public.current_user_role() = 'admin');

insert into public.membership_plans (name, duration_days, price) values
  ('Monthly', 30, 1500),
  ('Quarterly', 90, 4000),
  ('Half yearly', 180, 7500),
  ('Annual', 365, 14000);

insert into public.gym_settings (gym_name, theme) values ('GymFlow Gym', 'system');
