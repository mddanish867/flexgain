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
- **AI Coach** — describe your goal in plain words ("big biceps with all
  the cuts"), pick a focus area, and get a full 7-day split with per-
  exercise muscle targeting, extreme-intensity movements flagged, and the
  calories, protein and meals that back it. One click writes the whole
  thing into your real schedule.
- **Exercise auto-fill** — type an exercise name and the rest of the form
  fills itself: corrected name, description, the muscles it trains shown
  on a body map, sets, reps, a starting weight and form cues.
- **AI nutrition targets** — daily calorie and protein goals worked out
  from your goal and current weight, with a day of meals to hit them.
- **Settings** — update name, weight goal, calorie goal, protein goal,
  and kg/lb units (a real conversion, not just a label); sign out on this
  device or everywhere.
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
- **Postgres** via `pg` — all data is durable and shared across instances
- **Google Gemini** for the AI features, called over its REST API

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

## 🤖 AI features

Set `GEMINI_API_KEY` to switch them on. **Without a key the app runs
completely normally** — the AI routes answer 503 and the UI hides its
buttons, so nothing breaks and nothing looks half-finished.

```bash
# .env.local
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
# GEMINI_MODEL=gemini-2.5-flash    # the default
```

| Route | What it does |
| --- | --- |
| `POST /api/ai/exercise` | Name in, full exercise out: muscles, description, sets/reps/weight |
| `POST /api/ai/nutrition` | Daily calorie + protein targets and a day of meals |
| `POST /api/ai/plan` | A 7-day training block for a goal, plus its nutrition |
| `POST /api/ai/plan/[id]/apply` | Writes a plan into the real exercises and diet tables |
| `GET /api/ai/status` | Whether AI is configured (never returns the key) |

How it holds together:

- **`src/lib/ai/muscles.ts` is the contract.** One list of muscle ids is
  shared by the prompt, the response schema and the anatomy SVG, so an
  answer can always be drawn. Fine-grained ids collapse onto the coarse
  `MuscleGroup` the exercises table already stores.
- **Answers are validated twice.** Gemini's `responseSchema` constrains
  the structure during decoding; zod then checks the values, because a
  schema cannot tell you that 400 sets is wrong. Numbers and enums are
  strict; over-long prose is trimmed rather than rejected, since throwing
  away a good 30-second generation over a long sentence is worse.
- **Muscle diagrams are drawn, not generated.** An image model produces
  plausible bodies but cannot be trusted to put the lats in the right
  place. `MuscleAnatomy.tsx` has a shape per muscle and lights up exactly
  the ones the model named — accurate, instant and free.
- **Results are cached** in Postgres, keyed by a hash of the request with
  bodyweight bucketed, so repeat lookups cost nothing. The key carries a
  `CACHE_VERSION` — bump it whenever a prompt or schema changes, or old
  entries keep being served.
- **Safety constraints** are pinned in every system prompt: no drugs, no
  sub-1200 kcal targets, no water-cutting. "Extreme" means training
  intensity, never unsafe.

Swapping to the official `@google/generative-ai` SDK means rewriting
`callGemini` in `src/lib/ai/gemini.ts` and nothing else.

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

You will also need `DATABASE_URL` pointing at a Postgres instance, and
`GEMINI_API_KEY` if you want the AI features. Plan generation takes ~35
seconds, so the AI routes set `maxDuration = 60`.

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
│   ├── db.ts                   # Postgres pool + schema bootstrap
│   ├── units.ts                # kg/lb conversion
│   ├── rateLimit.ts            # sign-in rate limiting
│   ├── ai/                     # gemini client, prompts, schemas, cache
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
  writes return 401/403/404. That includes uploaded images: a read for an
  image you don't own is indistinguishable from one that doesn't exist.
- Sign-in is rate limited per IP (20 / 15 min, enforced *before* password
  hashing) and per email address (10 / 15 min). The per-email limit is
  checked only after a failed password check, so an attacker cannot lock
  a real user out of their own account by failing logins against it.
- An unknown email and a wrong password cost the same amount of hashing,
  so response timing does not reveal which addresses are registered.
- **Sign out everywhere** bumps a per-user `token_version` that every
  session is validated against, which revokes already-issued JWTs before
  their 14-day expiry — stateless tokens can't be deleted individually.
- Database TLS certificates are verified by default; see
  `DATABASE_SSL_NO_VERIFY` in `.env.example` for the escape hatch.
- Image upload is capped at 5 MB and rejects non-`image/*` payloads.
  Uploads are deleted with the exercise that references them.
- `/api/health` is intentionally unauthenticated for uptime probes and
  reports only whether the database answers — no counts, no user data.
- The dashboard and settings pages are gated by `middleware.ts`.

> **Never commit `.env`.** It is gitignored. If a `SESSION_SECRET` ever
> reaches a remote, rotate it — anyone holding it can mint a session for
> any account.

---

## 📝 License

Demo project — not licensed for redistribution.
