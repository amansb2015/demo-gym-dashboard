insert into public.members (
  full_name, phone, email, gender, join_date, membership_type,
  membership_start_date, membership_expiry_date, emergency_contact, status, notes
) values
  ('Aarav Sharma', '9876543210', 'aarav@example.com', 'male', current_date - interval '40 days', 'Monthly', current_date - interval '20 days', current_date + interval '10 days', '9811111111', 'active', 'Morning batch'),
  ('Isha Verma', '9876543211', 'isha@example.com', 'female', current_date - interval '75 days', 'Quarterly', current_date - interval '70 days', current_date + interval '20 days', '9822222222', 'active', 'Personal training lead'),
  ('Kabir Khan', '9876543212', null, 'male', current_date - interval '120 days', 'Monthly', current_date - interval '35 days', current_date - interval '5 days', '9833333333', 'active', 'Renewal follow-up needed');

insert into public.payments (
  member_id, amount, method, paid_at, receipt_id, transaction_id, upi_id, sender_name
)
select id, 1500, 'online', now() - interval '2 days', 'GYM-SEED-' || row_number() over (), 'UTR12345678' || row_number() over (), 'member@upi', full_name
from public.members
limit 2;

insert into public.attendance (member_id, check_in_at)
select id, now() - (row_number() over () || ' hours')::interval
from public.members;
