# Enabling cross-device sync (Supabase)

Without this, the planner is **local-only**: each device gets its own private
copy. Follow these steps once so everyone shares the same live wishlist and
schedule from their own phones.

## 1. Create a free Supabase project

1. Go to **https://supabase.com** → sign up / log in → **New project**.
2. Pick a name and a database password (any), choose the closest region, and
   wait ~2 minutes for it to provision.

## 2. Create the shared table

In the Supabase dashboard, open **SQL Editor → New query**, paste this, and click
**Run**:

```sql
create table if not exists public.plans (
  id text primary key,
  doc jsonb not null,
  updated_at timestamptz default now()
);

-- This trip planner has no logins, so allow the public anon key to read/write.
alter table public.plans enable row level security;

create policy "anyone can read"   on public.plans for select using (true);
create policy "anyone can insert" on public.plans for insert with check (true);
create policy "anyone can update" on public.plans for update using (true) with check (true);

-- Stream changes to every connected client.
alter publication supabase_realtime add table public.plans;
```

## 3. Grab your keys

In the dashboard go to **Settings → API** and copy:

- **Project URL** (e.g. `https://abcdxyz.supabase.co`)
- **anon public** key (the long one labeled `anon` / `public`)

## 4. Add them as GitHub repo secrets (for the deployed phone app)

In GitHub: **repo → Settings → Secrets and variables → Actions → New repository
secret**. Add:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your Project URL |
| `VITE_SUPABASE_ANON_KEY` | your anon public key |
| `VITE_TRIP_ID` | a shared code, e.g. `niner-2026` (optional; defaults to `family-trip`) |

Then re-run the deploy (push any commit, or **Actions → Deploy to GitHub Pages →
Run workflow**). When it finishes, the app header will show a green **“Group
sync”** badge instead of “This device only”.

## 5. (Local dev, optional)

Copy `.env.example` to `.env.local` and fill in the same values, then
`npm run dev`.

---

### Security note

There are no logins, so anyone who has both your site URL **and** the anon key
can read/write the trip. The anon key ships in the built site (it's public by
design), so effectively anyone with the link can edit. That's fine for a family
trip; just don't post the link publicly. Using a non-obvious `VITE_TRIP_ID` adds
a little obscurity. If you ever want real accounts/permissions, that's a larger
add with Supabase Auth.
