# FlexGain

> Build the body you came for. Training, fuel and progress — one sharp view.

FlexGain is a workout progress tracker built for lifters, calisthenics
athletes, hybrid athletes, and anyone who actually trains on a schedule.
Track every set, log your macros, watch the weight trend, plan the
diet, and see it all in one sharp, dark instrument panel.

---

## ✨ Features

- **Workout library** — full CRUD. Add exercises per muscle group (chest,
  back, legs, shoulders, arms, core, full body), assign them to days of
  the week, attach images, edit or delete on the fly.
- **Weekly training schedule** — overview page shows a 7-day strip with
  the day highlighted in red; click any day to filter your exercises.
- **Daily quick log** — weight + calories + protein in three taps from
  the overview.
- **Nutrition tracking** — daily calorie + protein targets with
  progress bars and a circular completion ring. History table of the
  last 30 entries.
- **Weight history** — auto-updated every time you log a meal with a
  weight value, or push a standalone entry. Recharts line chart of the
  last 90 days.
- **Muscle soreness tracking** — a body-map (front view) coloured by
  per-group soreness (1–10) over the last 7 days, with sliders to log
  today's soreness + whether you trained each group.
- **Diet planning** — per-day meal list with calories, protein, carbs,
  fat, and time; totals row; persistent for each date.
- **Auth + dashboard** — email/password with PBKDF2 hashing, JWT
  session in an HTTP-only cookie, sidebar layout, protected routes via
  Next.js middleware.
- **Settings** — update name, weight goal, calorie goal, protein goal,
  and kg/lb units; sign out.
- **Image uploads** — multipart upload, 5 MB cap, served back via a
  streaming route, scoped per user.
- **User dropdown** in the top bar after login with **Dashboard**,
  **Settings**, and **Sign out**.

---

## 📊 Market analysis

The fitness-tracking category is crowded, but each major player has a
narrow centre of gravity:

- **MyFitnessPal** — owns nutrition logging. Excellent food database,
  weak on workouts, social feed-forward UX, premium-tier paywall.
- **Strong** — owns lifting. Best-in-class set logging, but nutrition
  tracking is an afterthought and the analytics are paywalled.
- **Hevy** — owns the social/workout vibe. Strong community, strong
  workout tracker, no diet planning, free tier is limited.
- **FitNotes** — beloved on Android, workout-only, no UI polish.
- **Strava** — cardio-first, doesn't care about strength training.

FlexGain's wedge: **one dark, fast, opinionated place for training,
fuel, and weekly progress**, without a social feed, without streaks as
content, and without an influencer template gallery. It's for the
solo lifter who wants the same instrument-panel feel they get from a
running watch — but for strength training and the diet that backs it.

The closest analogue isn't any of the above — it's the dark-themed
developer-tool dashboards (Vercel, Linear, Plausible). FlexGain takes
that visual language and applies it to a personal fitness log.

---

## 🛠 Stack

- **Next.js 14** (App Router) + TypeScript (strict)
- **Tailwind CSS** for styling (FlexGain design tokens)
- **Recharts** for the weight-trend chart
- **lucide-react** for icons
- **jose** for JWT signing (HS256, edge-runtime safe)
- **zod** for input validation
- **clsx + tailwind-merge** for conditional classes
- **In-memory data store** (see *Demo data caveat* below) — no DB

---

## 🚀 Run it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local — set SESSION_SECRET to anything >= 16 chars
npm run dev
# open http://localhost:3000
```

A demo account is created automatically on first request:

```
email:    demo@flexgain.app
password: demo1234
```

## 📦 Production build

```bash
npm run build
npm run start
```

---

## ⚠️ Demo data caveat

This project uses a **process-memory data store**. There is no database.
On every server restart — including each Vercel cold start — every user,
exercise, nutrition log, weight entry, muscle log, diet plan, and
**every uploaded image is lost**. The store also resets on every
Next.js HMR module reload in dev.

This is intentional for a single-process demo build, and is documented
in code:

- `src/lib/store.ts` — singleton user store + per-user collections
- `src/lib/users.ts` — user CRUD
- `src/lib/exercises.ts`, `nutrition.ts`, `muscles.ts`, `diet.ts` —
  scoped repositories
- Uploaded images are kept as base64 in the same in-memory store; they
  have no persistence.

A real deployment should swap `src/lib/store.ts` for Postgres / SQLite /
Drizzle / Prisma. The data shapes in `src/lib/types.ts` are designed to
make that swap mechanical — all mutations go through repository
functions, so swapping the backend is a single-file change.

---

## ☁️ Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment variables**: set `SESSION_SECRET` to a strong random
   string. Generate one with:
   ```bash
   openssl rand -base64 48
   ```
   Production builds without a `SESSION_SECRET` fall back to an
   insecure dev secret — **do not skip this step**.
5. Click **Deploy**. Vercel will run `next build` and serve from the
   edge.

Because data is in-memory, the **first request after each cold start
will look like a fresh install**. For a real launch you'll want to wire
up a database and an object store for uploaded images.

`vercel.json` is included with the framework preset, region, and a
private cache-control header for the image streaming route.

---

## 🗂 Project layout

```
src/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── auth/               # signup, login, logout, me
│   │   ├── exercises/          # CRUD: /api/exercises, /[id]
│   │   ├── nutrition/          # CRUD: /api/nutrition, /[id]
│   │   ├── weight/             # POST /api/weight (standalone)
│   │   ├── muscles/            # POST /api/muscles (soreness)
│   │   ├── diet/               # CRUD: /api/diet, /[id]
│   │   ├── images/             # POST upload, GET /[id], DELETE /[id]
│   │   ├── settings/           # GET, PATCH
│   │   ├── dashboard/          # aggregate payload for the dashboard
│   │   └── health/             # GET /api/health
│   ├── dashboard/              # /dashboard + /workouts + /nutrition + /progress
│   ├── settings/               # /settings
│   ├── login/, signup/
│   ├── error.tsx, not-found.tsx, robots.ts, sitemap.ts
│   ├── layout.tsx              # root layout, fonts, metadata
│   ├── globals.css             # Tailwind + tokens
│   └── page.tsx                # landing page
├── components/
│   ├── ui/                     # design system (Button, Card, …)
│   ├── auth/                   # AuthForm
│   ├── dashboard/              # DashboardShell, SettingsForm, *Client.tsx
│   └── landing/                # all landing sections
├── lib/
│   ├── cn.ts                   # clsx + tailwind-merge helper
│   ├── password.ts             # PBKDF2 hashing
│   ├── session.ts              # JWT signing + cookies
│   ├── store.ts                # in-memory data store
│   ├── types.ts                # shared types
│   ├── users.ts                # user repo
│   ├── exercises.ts            # exercise repo
│   ├── nutrition.ts            # nutrition + weight repo
│   ├── muscles.ts              # muscle soreness repo
│   ├── diet.ts                 # diet plan repo
│   ├── imageStore.ts           # image blob repo (base64)
│   ├── currentUser.ts          # server-side helper
│   ├── client.ts               # client-side API helpers
│   └── seed.ts                 # demo user + sample data
└── middleware.ts               # auth gate for /dashboard, /settings
```

---

## 🔐 Security notes

- Passwords are hashed with PBKDF2-SHA256 + per-user salt (`crypto.subtle`).
- Session JWTs are HS256-signed, stored in HTTP-only, sameSite=lax,
  Secure-in-prod cookies.
- All API routes are scoped to the current user — cross-user reads or
  writes return 401/403/404.
- Image upload is capped at 5 MB and rejects non-`image/*` payloads.
- The dashboard and settings pages are gated by `middleware.ts`.

---

## 📝 License

Demo project — not licensed for redistribution.
