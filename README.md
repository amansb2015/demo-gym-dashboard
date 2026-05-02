# GymFlow Local Gym Manager

Mobile-first Progressive Web App for a small local gym owner. It covers secure admin/staff login, members, payments, OCR screenshot reading, attendance, renewals, reports, settings, Supabase schema, and Vercel-ready deployment.

## Stack

- React + Vite + TypeScript
- TailwindCSS
- React Router
- Supabase Auth, Postgres, Row Level Security, Storage
- Tesseract.js OCR
- Recharts analytics
- PWA manifest + service worker

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Start the app:

```bash
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Optional: run `supabase/seed.sql` for sample members, payments, and attendance.
4. The schema creates Storage buckets for `payment-screenshots`, `member-photos`, and `gym-assets`. Payment screenshots are private by default.
5. If you later display screenshot previews, generate signed URLs for `payment-screenshots` instead of exposing public URLs.
6. If your database was created before the UTR field was added, run `supabase/add_utr_number.sql` once.
7. Create users in Supabase Auth.
8. Set the first owner as admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Owner Name'
where id = 'auth-user-uuid';
```

New users are created as `staff` by default.

## Security Model

- Supabase Auth handles email/password and session persistence.
- Dashboard routes are protected client-side.
- Postgres Row Level Security protects tables server-side.
- Staff can add members, payments, screenshots, and attendance.
- Admin can delete records, manage plans/settings/staff, and view revenue reports.

## PWA

The app includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- offline fallback page
- standalone display mode
- mobile icon assets
- safe-area spacing for installed iOS/Android usage

Build and serve over HTTPS for install prompts and Add to Home Screen.

## OCR Payment Workflow

1. Staff uploads a UPI/bank confirmation screenshot.
2. Tesseract.js reads text in the browser.
3. The app extracts amount, UPI ID, transaction/reference ID, date/time, and sender name when visible.
4. Staff reviews and corrects fields.
5. Screenshot uploads to Supabase Storage and payment saves to Postgres with an auto receipt ID.

OCR quality depends on screenshot clarity. Keep manual correction available, as implemented.

## Vercel Deployment

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Framework preset: `Vite`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy.

## Production Notes

- Use HTTPS only.
- Keep Supabase RLS enabled.
- Make screenshots private if receipts contain sensitive data.
- Consider Supabase Edge Functions for WhatsApp reminders and PDF reports.
- Add real PNG app icons if strict app-store-like PWA install polish is required on every Android launcher.
