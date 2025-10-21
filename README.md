## SheFi Wall

Digital wall where SheFi queens slap virtual post-its with their wins, chaos, and confessions. Built with Next.js App Router, Tailwind v4, Supabase, Masonry layout, and a sprinkle of glitter.

> ✨ _Landing copy, component microcopy, and interaction details strictly follow the product brief._  
> Supabase-backed real-time updates keep the wall lively; a client-side sample dataset renders when Supabase credentials are missing.

---

## Stack

- **Next.js 15** (App Router, TypeScript, server components + client modals)
- **Tailwind CSS 4** with custom SheFi palette
- **Supabase** (PostgreSQL, Realtime, rate limiting via RPC/table logic)
- **Framer Motion** for wall animations
- **react-masonry-css** for responsive pinterest-style layout
- **html2canvas** + browser share APIs for downloadable post-its
- **canvas-confetti** for celebratory drops

---

## Running Locally

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the environment template and add your Supabase credentials (URL, anon key, and service role key).

   ```bash
   cp .env.local.example .env.local
   ```

3. Start the development server

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the wall. Without Supabase credentials you’ll see demo notes and the “slap it” button will warn you to connect Supabase before posting.

---

## Supabase Setup

Create the tables exactly as defined in the product brief:

```sql
create table postit (
  id uuid default gen_random_uuid() primary key,
  text varchar(150) not null,
  color text not null,
  signature text,
  "isAnonymous" boolean default true,
  "createdAt" timestamptz default now(),
  hearts integer default 0,
  position bigint default extract(epoch from now()) * 1000,
  "ipHash" text not null,
  shares integer default 0
);

create table hearts (
  id bigint generated always as identity primary key,
  "postItId" uuid references postit(id) on delete cascade,
  "ipHash" text not null,
  "createdAt" timestamptz default now(),
  unique ("postItId", "ipHash")
);

create table postitreports (
  id bigint generated always as identity primary key,
  "postItId" uuid references postit(id) on delete cascade,
  "ipHash" text not null,
  "createdAt" timestamptz default now()
);
```

Trigger/utility for atomic heart increments:

```sql
create or replace function increment_hearts(target_post_id uuid)
returns void
language plpgsql
as $$
begin
  update postit
  set hearts = hearts + 1
  where id = target_post_id;
end;
$$;
```

Enable realtime on `postit` and `hearts` tables so newly created notes and hearts broadcast immediately.

> Anti-spam rules (5 posts/hour per IP, no duplicates within 24h, 10 character min) are enforced in `/api/post-its` using the `ipHash` column. Supply the `SUPABASE_SERVICE_ROLE_KEY` server-side for those checks to succeed.

---

## Feature Checklist

- ✅ Landing header: “SheFi Wall ✨ Where queens leave their marks”
- ✅ Masonry wall (desktop 4-5 cols, tablet 3, mobile 2) with random tilt, hover float, fresh glow, timestamp, hearts, signatures
- ✅ FAB: “Slap your truth here 👋” fixed bottom-right across breakpoints
- ✅ Creation modal with rotating prompts, 150 character counter, color palette + hue slider, signature toggle, anti-spam notice, themed loading/success copy
- ✅ Real-time inserts + heart updates via Supabase Realtime
- ✅ New posts animate in with spring drop + confetti and temporary glow
- ✅ Share sheet (for owner only): html2canvas PNG download, clipboard copy, pre-filled tweet, native share (mobile)
- ✅ Social proof counter + recent activity toast: “A queen just posted...”
- ✅ Daily vibes unlocks (golden hour, midnight thoughts, sunrise hues) with banner hints
- ✅ Word filter + per-IP rate limiting as instructed
- ✅ Report button & Supabase table for moderation queue
- ✅ Dynamic route `/post/[id]` for deep links/SEO

---

## Copy & Microcopy

All microcopy strings come directly from the brief:

- Empty state: “Be the first queen to leave her mark 👑” / “The wall is waiting for your chaos...”
- Loading: “Yeeting to the wall...”
- Success: “Your truth has been slapped! 💅”
- Error: “That didn’t stick! Give it another slap?”
- CTA labels: “Slap it!”, “Spill the tea”, “Leave your mark”, “Join the chaos”

---

## Testing / Next Steps

- `npm run lint` covers static analysis.
- Add E2E smoke tests (Playwright/Cypress) once Supabase credentials are wired up.
- Hook in moderation automation (e.g., Supabase Edge Function) if further filters are needed.
- Deploy via Vercel; remember to expose the Supabase environment variables in the project settings.

Have fun, queens. 👑
