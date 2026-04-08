<div align="center">

<img src="banner.jpg" alt="Commit Crown" width=100% />

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vercel](https://img.shields.io/badge/Deployed_on_Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/license-MIT-C9A84C?style=flat-square)](LICENSE)

[Live Demo](https://commitcrown.vercel.app) · [Documentation](https://commitcrown.io/docs) · [Report a Bug](https://github.com/yourusername/commit-crown/issues) · [Request a Feature](https://github.com/yourusername/commit-crown/issues)

</div>

A developer platform that transforms real GitHub contribution data into a persistent, playable 2D strategy game — with structured learning, social competition, and a cosmetics marketplace.

---

## What Is This

Commit Crown is a **SaaS-style developer platform** combining three layers:

| Layer        | Description                                                                             |
| ------------ | --------------------------------------------------------------------------------------- |
| **Game**     | 2D isometric strategy — buildings, raids, leaderboards driven by your real GitHub stats |
| **Learning** | Structured video + GIF-based tutorials with documentation-style navigation              |
| **Social**   | Public kingdom URLs, visit system, contribution-based global rankings                   |

Every in-game resource maps directly to a GitHub metric. No fake grind. No idle timers disconnected from real activity.

---

## Core Mechanic

```
Code IRL  →  GitHub sync  →  Kingdom grows  →  Compete & share  →  Repeat
```

| GitHub Metric  | In-Game Resource   | Effect                                      |
| -------------- | ------------------ | ------------------------------------------- |
| Total commits  | Gold               | Primary currency for buildings and upgrades |
| Stars received | Prestige           | Leaderboard score, unlocks Monument         |
| Commit streak  | Defense multiplier | Active streak = active shield               |
| PRs merged     | Attack rating      | Determines raid success probability         |
| Followers      | Population cap     | Limits army size                            |
| Repo count     | Building slots     | Capped at 20                                |
| Top language   | Special building   | Language-specific structure unlock          |
| Issues closed  | Repair speed       | Faster post-raid recovery                   |

---

## Tech Stack

| Layer       | Technology                                               |
| ----------- | -------------------------------------------------------- |
| Framework   | Next.js 14 (App Router)                                  |
| Game Engine | Phaser.js 3 — isometric canvas, client-only              |
| Database    | Supabase (Postgres + Realtime + RLS)                     |
| Auth        | GitHub OAuth via Supabase                                |
| State       | Zustand                                                  |
| UI          | Tailwind CSS + shadcn/ui                                 |
| Payments    | Stripe _(testing)_ → Razorpay _(production, on release)_ |
| Deployment  | Vercel                                                   |
| Assets      | Supabase Storage + CDN                                   |

> **Payment note:** Stripe is active in the current testing environment. Razorpay will replace it on production release for real-time INR transaction support.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Stripe](https://stripe.com) account _(testing only)_

### Installation

```bash
git clone https://github.com/yourusername/commit-crown.git
cd commit-crown
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub OAuth (redirect URI → /auth/callback)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# GitHub API (personal access token for sync)
GITHUB_TOKEN=

# Stripe (testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron security
CRON_SECRET=
```

### Database Setup

```bash
npx supabase start
npx supabase db push
```

Migrations run in order:

| File                     | Scope                                       |
| ------------------------ | ------------------------------------------- |
| `001_initial_schema.sql` | profiles, kingdoms, buildings, github_stats |
| `002_raids.sql`          | raid table, cooldowns, RLS policies         |
| `003_leaderboard.sql`    | ranking views and functions                 |
| `004_razorpay.sql`       | shop_items, owned_items, payment records    |
| `005_shop_seed.sql`      | default marketplace catalog                 |

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
commit-crown/
├── src/
│   ├── app/
│   │   ├── (auth)/login/               # GitHub OAuth entry
│   │   ├── (game)/
│   │   │   ├── kingdom/                # Main game canvas
│   │   │   ├── visit/[username]/       # Public kingdom view
│   │   │   ├── leaderboard/            # Global rankings
│   │   │   └── onboarding/             # First-run flow
│   │   ├── (shop)/marketplace/         # Cosmetics store
│   │   ├── api/
│   │   │   ├── github/sync/            # Fetch + cache GitHub data
│   │   │   ├── kingdom/                # Building CRUD (server-authoritative)
│   │   │   ├── raid/                   # Raid resolution (server-side only)
│   │   │   ├── razorpay/               # create-order / verify / webhook
│   │   │   ├── shop/                   # Items, free-claim, equip
│   │   │   ├── achievements/check/     # Achievement evaluation
│   │   │   ├── visit/record/           # Visit tracking
│   │   │   ├── og/[username]/          # Dynamic OG image per kingdom
│   │   │   └── cron/sync-all/          # Nightly GitHub sync (Vercel cron)
│   │   └── auth/callback/              # OAuth handler
│   ├── components/
│   │   ├── game/                       # PhaserGame.tsx, scenes/, entities/
│   │   ├── ui/                         # HUD, modals, toasts, guards
│   │   └── social/                     # KingdomCard, ScoutReport, Leaderboard
│   ├── lib/
│   │   ├── supabase/                   # client.ts / server.ts / middleware.ts
│   │   ├── github.ts                   # GitHub REST + GraphQL client
│   │   ├── gameEngine.ts               # GitHub stats → game resource mapper
│   │   ├── achievements.ts             # Achievement evaluation logic
│   │   ├── razorpay.ts                 # Payment helpers
│   │   └── realtimeNotifications.ts    # Supabase Realtime channels
│   ├── store/
│   │   ├── kingdomStore.ts             # Kingdom state
│   │   └── notificationStore.ts        # Notification queue
│   ├── types/
│   │   ├── game.ts
│   │   ├── razorpay.d.ts
│   │   └── supabase.ts                 # Generated via Supabase CLI
│   └── middleware.ts                   # Auth guard + route protection
├── supabase/
│   ├── migrations/
│   └── config.toml
├── public/assets/
│   ├── tiles/                          # Isometric ground tiles
│   ├── buildings/                      # Sprites per type + level
│   ├── units/                          # Army unit sprites
│   ├── ui/                             # Icons, badges, frames
│   └── themes/                         # Kingdom theme overlays
├── scripts/
│   └── integration-check.sh            # Env + service connectivity check
├── .env.example
├── next.config.ts
├── vercel.json
└── tailwind.config.ts
```

---

## Architecture Decisions

**Phaser is client-only — never SSR.**
Loaded exclusively via `dynamic(() => import('./PhaserGame'), { ssr: false })`. Any SSR attempt will crash the server.

**GitHub API is cached in Supabase — never called on page load.**
Rate limit is 5,000 req/hr per token. Sync runs on login and via nightly cron. Manual re-sync enforces a 30-minute per-user cooldown. GitHub API is never called from the client.

**All raid outcomes are computed server-side.**
`/api/raid/initiate` owns outcome computation and atomic DB writes. The client sends the intent; the server decides the result.

**Stripe webhook — not the client success redirect — is the source of payment truth.**
Purchases are fulfilled only after `stripe.webhooks.constructEvent()` passes. Unverified payloads are rejected with `400`.

**RLS is enforced from migration 001.**
Row Level Security is active on every table before any data is written. All policies are scoped to `auth.uid()`.

---

## Features

### Kingdom Engine

- Isometric 2D grid in Phaser.js
- Auto-generated kingdom on first GitHub sync
- Resources: Gold, Prestige, Population, Defense — all GitHub-backed
- Building placement + upgrade system (level 1–5)
- Day/night cycle (cosmetic)

### Buildings

| Building          | Unlock Condition | Effect                      |
| ----------------- | ---------------- | --------------------------- |
| Town Hall         | Always present   | Level = commit count tier   |
| Arcane Tower      | JS/TS repos      | +attack power               |
| Library of Wisdom | Python repos     | +prestige generation        |
| Iron Forge        | Rust/C++ repos   | +defense rating             |
| Swift Barracks    | Go/Swift repos   | +army capacity              |
| Observatory       | 30-day streak    | +scout ability on raids     |
| Grand Market      | 10+ repos        | +gold income rate           |
| Wall of Shields   | 50+ PRs merged   | +defense multiplier         |
| Monument          | Top 10 global    | Cosmetic prestige structure |

### Social

- **Visit system** — Any player can view any public kingdom. Scout report surfaces stats.
- **Raid system** — Opt-in only. Async turn-based. Max 10% gold per raid. 24hr cooldown per target. Newcomer protection window active.
- **Leaderboard** — Global by prestige, by language, by region. Weekly reset for most-active.
- **Realtime notifications** — Raid alerts, visit events, achievement unlocks via Supabase Realtime.

### Achievements

| Achievement   | Category | Condition                                 |
| ------------- | -------- | ----------------------------------------- |
| Night Owl     | Coding   | Committed past midnight 10+ times         |
| Polyglot      | Coding   | 5+ languages across repos                 |
| Centurion     | Coding   | 100 commits in a single month             |
| Streak Master | Coding   | 30-day commit streak                      |
| Conqueror     | Game     | Won 10 raids                              |
| Architect     | Game     | Any building maxed to level 5             |
| Diplomat      | Game     | Visited 20 different kingdoms             |
| Ghost Coder   | Rare     | Committed at 3am 5 times                  |
| The Silent    | Rare     | Top 50 prestige with zero social activity |
| Legend        | Rare     | Top 10 global for 4 consecutive weeks     |

### Marketplace

- One-time cosmetic purchases only
- No loot boxes — all items visible before purchase
- No pay-to-win mechanics of any kind
- Free items unlocked via achievements
- Gift system: send cosmetics to other players
- Item types: building skins, kingdom themes, banner designs, profile frames

---

## UX Principles

| Principle                      | Implementation                                                       |
| ------------------------------ | -------------------------------------------------------------------- |
| Onboarding under 2 minutes     | Login → sync → name kingdom → place first building → done            |
| New users don't look empty     | Zero commits = starter kingdom with "potential shown" UI             |
| Public URLs work without login | `/kingdom/username` is fully public; login required only to interact |
| Sound off by default           | All audio disabled until explicitly toggled                          |

---

## Roadmap

| Phase               | Timeline | Scope                                                   |
| ------------------- | -------- | ------------------------------------------------------- |
| **Foundation**      | Week 1–2 | Auth, DB schema, GitHub sync engine                     |
| **Core Game**       | Week 3–4 | Phaser scene, buildings, HUD, upgrades                  |
| **Social**          | Week 5   | Visit, raid, leaderboard, realtime                      |
| **Marketplace**     | Week 6   | Shop UI, Stripe _(test)_ → Razorpay _(prod)_, cosmetics |
| **Polish & Launch** | Week 7–8 | Mobile HUD, onboarding, OG images, SEO, Vercel deploy   |

---

## Contributing

```bash
# 1. Fork and clone
git checkout -b feature/your-feature

# 2. Verify environment before starting
bash scripts/integration-check.sh

# 3. Commit with context
git commit -m "feat: describe what and why"

# 4. Open a pull request
```

**Hard rules for contributors:**

- All state-mutating logic must remain in API routes — never in client components
- Raid outcomes, payment fulfillment, and achievement evaluation are server-only
- RLS policies must be included with any new table migration
- No new client-side GitHub API calls

---

## Design System

| Token         | Value     | Usage                       |
| ------------- | --------- | --------------------------- |
| Primary dark  | `#0D0D1A` | Base background             |
| Surface       | `#161628` | Panels, modals              |
| Gold accent   | `#C9A84C` | Resources, CTAs, highlights |
| Danger red    | `#C0392B` | Raid alerts, low health     |
| Success green | `#27AE60` | Growth, achievement unlock  |
| Info blue     | `#2980B9` | Visit events                |
| Text primary  | `#E8E8F0` | Body text                   |
| Text muted    | `#8888AA` | Labels, metadata            |

**Typography:** Cinzel (kingdom names, titles) · Inter (UI, HUD) · Fira Code (resource numbers, stats)

Dark mode only. No light theme.

---

## Success Metrics — v1 Targets

| Category  | Metric                   | Target                   |
| --------- | ------------------------ | ------------------------ |
| Product   | Time-to-wow              | < 60 seconds             |
| Product   | Day 7 retention          | > 30%                    |
| Product   | Onboarding completion    | > 70%                    |
| Product   | Median session length    | > 4 minutes              |
| Social    | Raid opt-in rate         | > 40%                    |
| Revenue   | Paid conversion          | > 5% of registered users |
| Revenue   | Refund rate              | < 2%                     |
| Technical | GitHub sync success rate | > 98%                    |
| Technical | API response time (p95)  | < 300ms                  |
| Technical | Phaser canvas load       | < 2 seconds              |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [Mr Sharma](https://github.com/yourusername)

_Your commits built this._

</div>
