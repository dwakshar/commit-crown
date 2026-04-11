<div align="center">

<img src="banner.jpg" alt="Commit Crown" width="100%" />

# Contributing to Commit Crown

**Thank you for wanting to make the realm stronger.**
This guide covers everything you need to go from zero to a merged pull request — environment setup, architecture rules, commit conventions, and the hard lines you cannot cross.

</div>

---

## Table of Contents

- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [The Hard Rules](#the-hard-rules)
- [Branch & Commit Conventions](#branch--commit-conventions)
- [Making Changes](#making-changes)
- [Database Migrations](#database-migrations)
- [Testing Your Changes](#testing-your-changes)
- [Pull Request Process](#pull-request-process)
- [Design System](#design-system)
- [What We Welcome](#what-we-welcome)
- [What We Will Not Merge](#what-we-will-not-merge)
- [Getting Help](#getting-help)

---

## Before You Start

Check the [open issues](https://github.com/dwakshar/commit-crown/issues) before starting any work. If you want to build something new that isn't tracked yet, **open an issue first** and describe what you want to do. This avoids duplicated effort and lets us tell you early if the direction doesn't fit.

For **bug fixes**, you can jump straight to a PR without an issue.
For **new features or architectural changes**, always start with an issue.

---

## Development Setup

### Prerequisites

| Tool         | Minimum version | Why                        |
| ------------ | --------------- | -------------------------- |
| Node.js      | 18.17+          | Next.js 14 requirement     |
| npm          | 9+              | Lockfile format            |
| Git          | 2.30+           | Sparse checkout support    |
| Supabase CLI | latest          | Running migrations locally |

### Step 1 — Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/commit-crown.git
cd commit-crown
npm install
```

### Step 2 — Create your environment file

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. None of these are optional — the app will throw at startup if any are missing:

```env
# Supabase — get from your project dashboard at supabase.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub OAuth App — create at github.com/settings/developers
# Callback URL: http://localhost:3000/auth/callback
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# GitHub personal access token — for local GitHub sync
# Scopes needed: read:user, repo
GITHUB_TOKEN=

# Stripe — use test keys only locally, never live keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron auth secret — any random string works locally
CRON_SECRET=local-dev-secret
```

> **Never commit `.env.local`.** It is already in `.gitignore`. Do not create a `.env` file at the root — Next.js will not load it for local dev and it is easy to accidentally commit.

### Step 3 — Set up the database

```bash
# Start local Supabase (Docker must be running)
npx supabase start

# Push all migrations in order
npx supabase db push
```

Supabase will print a local Studio URL (`http://localhost:54323`) where you can inspect tables and run queries.

### Step 4 — Configure GitHub OAuth for local dev

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/auth/callback`
4. Copy the Client ID and Client Secret into `.env.local`
5. In your [Supabase dashboard](https://supabase.com) → **Authentication** → **Providers** → **GitHub** → paste the same values

### Step 5 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with GitHub — your kingdom will be generated from your real GitHub data.

### Step 6 — (Optional) Test Stripe webhooks locally

In a separate terminal:

```bash
# Install Stripe CLI if you haven't
brew install stripe/stripe-cli/stripe   # macOS
# or: https://stripe.com/docs/stripe-cli

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret printed by the CLI and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Project Architecture

Understanding this before writing code will save you from building things in the wrong place.

### Directory layout

```
commit-crown/
├── app/                        # Next.js App Router root — mostly re-export shims
│   ├── (game)/                 # Game route group shims
│   ├── (shop)/                 # Shop route group shims
│   ├── api/                    # API route shims → delegate to src/app/api/
│   ├── auth/callback/          # GitHub OAuth callback — lives here, not in src/
│   ├── layout.tsx              # Root layout with fonts and global cursor
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles and design tokens
│
├── src/                        # All real application code lives here
│   ├── app/
│   │   ├── (game)/             # Kingdom, visit, leaderboard, raids, onboarding
│   │   ├── (shop)/             # Marketplace
│   │   └── api/                # All API route implementations
│   ├── components/
│   │   ├── game/               # PhaserGame.tsx, scenes/, entities/
│   │   ├── ui/                 # HUD, modals, toasts, guards, cursor
│   │   └── social/             # LeaderboardTable, ScoutReport, RaidModal
│   ├── lib/                    # Pure business logic — no React
│   │   ├── gameEngine.ts       # GitHub stats → kingdom resource mapper
│   │   ├── githubSync.ts       # GitHub fetch + Supabase write orchestration
│   │   ├── achievements.ts     # Achievement evaluation and award logic
│   │   ├── kingdom.ts          # Building metadata and helpers
│   │   ├── kingdomPersistence.ts # DB read/write for kingdom state
│   │   ├── shop.ts             # Shop item types and helpers
│   │   ├── stripe/             # Stripe client (server.ts) and helpers
│   │   ├── supabaseAdmin.ts    # Service-role Supabase client
│   │   └── realtimeNotifications.ts
│   ├── store/
│   │   ├── kingdomStore.ts     # Zustand — kingdom state
│   │   └── notificationStore.ts
│   └── types/
│       └── game.ts             # All shared TypeScript types
│
├── lib/                        # Root-level re-exports (shims only — do not add logic here)
├── store/                      # Root-level re-export of src/store (shim only)
├── utils/supabase/             # Browser and server Supabase client factories
├── supabase/migrations/        # Ordered SQL migrations — never edit existing files
├── proxy.ts                    # ⚠️ Should be named middleware.ts — auth route guard
└── vercel.json                 # Cron schedule for nightly GitHub sync
```

### Key architecture decisions

**Phaser is client-only — always.**
Import `PhaserGame` exclusively via `dynamic(() => import('...'), { ssr: false })`. Any direct server-side import of Phaser will crash the build with `window is not defined`.

**GitHub API is never called from the client.**
All GitHub data flows through `/api/github/sync` which caches everything in Supabase. The rate limit is 5,000 req/hr — one bad client-side call loop can exhaust it for all users.

**All raid outcomes are computed server-side.**
The `/api/raid/initiate` route owns the full outcome calculation and atomic DB write via the `execute_raid_transaction` stored procedure. The client only sends intent and reads the result.

**Stripe webhook is the only source of payment truth.**
Purchases are fulfilled exclusively after `stripe.webhooks.constructEvent()` succeeds in `/api/stripe/webhook`. Never grant ownership based on the client-side success redirect.

**`supabaseAdmin` is server-only.**
It holds the service role key. Never import it in a client component or any file that might be bundled client-side. Add `import 'server-only'` to any new file that uses it.

**RLS policies ship with every new table.**
Row Level Security must be enabled on every new table in the same migration that creates it. No exceptions.

---

## The Hard Rules

These are non-negotiable. PRs that violate them will not be merged regardless of how good the rest of the code is.

```
✗  No state-mutating logic in client components or hooks
   → All writes to the database happen through API routes

✗  No client-side GitHub API calls
   → GitHub data flows through /api/github/sync only

✗  No raid outcome logic outside /api/raid/initiate
   → The server resolves raids; the client displays results

✗  No payment fulfillment outside the Stripe webhook handler
   → Ownership is granted only after signature verification

✗  No new table without an RLS policy in the same migration
   → Every table must have row-level security from the moment it exists

✗  No importing supabaseAdmin in client components
   → Service role key must never reach the browser bundle

✗  No direct import of Phaser in server components
   → Always use dynamic(() => import('./PhaserGame'), { ssr: false })
```

---

## Branch & Commit Conventions

### Branch naming

```
feat/short-description          # New feature
fix/short-description           # Bug fix
chore/short-description         # Tooling, deps, config
migration/short-description     # Database schema change
docs/short-description          # Documentation only
```

Examples:

```
feat/achievement-night-owl
fix/raid-cooldown-not-resetting
migration/add-kingdom-banner-column
chore/upgrade-supabase-ssr
```

### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Night Owl achievement for late-night commits
fix: raid cooldown not resetting after 24 hours
chore: upgrade @supabase/ssr to 0.9.0
migration: add banner_id column to kingdoms table
docs: clarify server-only rule in CONTRIBUTING
refactor: extract toKingdomData helper into kingdomPersistence
```

**Format:**

- `feat` — new capability
- `fix` — corrects a bug
- `chore` — maintenance, tooling, dependency bumps
- `migration` — any change to `supabase/migrations/`
- `docs` — documentation only, no code change
- `refactor` — restructure without changing behaviour
- `perf` — measurable performance improvement
- `test` — adding or fixing tests

Keep subject lines under 72 characters. If the change needs more context, add a blank line and a body paragraph.

---

## Making Changes

### For a new feature

```bash
# 1. Create a branch from main
git checkout main && git pull upstream main
git checkout -b feat/your-feature

# 2. Write your code in src/ — never in root lib/ or root app/
#    (root files are shims only)

# 3. If you need a new API route, create it in:
#    src/app/api/your-route/route.ts
#    Then add a one-line re-export shim in:
#    app/api/your-route/route.ts

# 4. Lint and typecheck before committing
npm run lint
npx tsc --noEmit

# 5. Commit
git commit -m "feat: your description"

# 6. Push and open a PR
git push origin feat/your-feature
```

### For a bug fix

Same flow as above but use `fix/` prefix. In the PR description, include:

- What the bug was
- What caused it
- How your fix addresses the root cause (not just the symptom)

### Changing game mechanics

Any change to `src/lib/gameEngine.ts` (the GitHub → kingdom resource mapping) affects every user's kingdom the moment it deploys. These changes require:

1. An issue discussing the change before you write code
2. A clear explanation of why the new mapping is more fair or correct
3. Consideration of existing players — don't silently nerf kingdoms

---

## Database Migrations

### Creating a migration

```bash
# Always use the CLI — never create migration files by hand
npx supabase migration new your-migration-name

# This creates:
# supabase/migrations/TIMESTAMP_your-migration-name.sql
```

### Migration rules

**Never edit an existing migration file.** Once a migration has been pushed to any environment, it is immutable. To change something, create a new migration.

**Every new table needs RLS in the same file:**

```sql
-- Create the table
create table public.your_table (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Enable RLS immediately — never in a separate migration
alter table public.your_table enable row level security;

-- Add policies
create policy "Users can view own rows"
  on public.your_table for select
  using (auth.uid() = user_id);

create policy "Service role full access"
  on public.your_table for all
  using (auth.role() = 'service_role');
```

**Test your migration locally before pushing:**

```bash
# Reset your local db to a clean state and re-run all migrations
npx supabase db reset

# Verify the migration applied cleanly
npx supabase db push
```

**If your migration adds a column to an existing table**, check whether any TypeScript types in `src/types/game.ts` or any Supabase query needs updating to include that column.

---

## Testing Your Changes

There are no automated tests yet. Until they exist, the manual checklist below is required before every PR.

### Core flow

```bash
# 1. Sign in with GitHub — confirm redirect to /onboarding on first login
# 2. Complete onboarding — name your kingdom, confirm redirect to /kingdom
# 3. Trigger a GitHub sync — confirm resources update correctly
# 4. Place a building — confirm it appears on the isometric grid
# 5. Visit another kingdom — confirm /visit/[username] loads without SSR crash
# 6. Upgrade a building — confirm gold is deducted server-side
# 7. Check leaderboard — confirm all three tabs load
```

### If your change touches the raid system

```bash
# Enable raids on both test accounts
# Initiate a raid — confirm result comes from the server
# Confirm gold transfer is atomic (check DB directly in Supabase Studio)
# Confirm notification is created for the defender
# Confirm cooldown prevents a second raid within 24hrs
```

### If your change touches the shop or Stripe

```bash
# Run the Stripe CLI listener in a separate terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Attempt a purchase — confirm item ownership is granted only after the webhook fires
# Attempt to claim a free item — confirm it appears in owned_items
# Equip an item — confirm it is reflected in the kingdom data returned by /api/kingdom
```

### TypeScript and lint

Always run both before opening a PR:

```bash
npm run lint
npx tsc --noEmit
```

Zero errors. Zero warnings. If you introduce a `// eslint-disable` comment, explain why in the PR description.

---

## Pull Request Process

### PR title

Use the same Conventional Commits format as your commit messages:

```
feat: add Night Owl achievement for late-night commits
fix: raid cooldown not resetting after 24 hours
```

### PR description template

```markdown
## What this does

One paragraph explaining the change and why it's needed.

## How to test

Step-by-step instructions for reviewing the PR manually.

## Screenshots / recordings (if UI change)

Before / after, or a short screen recording.

## Checklist

- [ ] `npm run lint` passes with zero warnings
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] New tables include RLS policies in the same migration
- [ ] No client-side GitHub API calls added
- [ ] No state-mutating logic in client components
- [ ] No Phaser imported without `dynamic(..., { ssr: false })`
- [ ] No `supabaseAdmin` imported in client code
```

### Review process

- PRs are reviewed by the maintainer within 3 business days
- One approval is required to merge
- Automated CI will run lint and typecheck — both must pass
- Force-pushes to your branch are fine before approval, not after

---

## Design System

All UI must use these tokens from `app/globals.css`. Do not introduce new colours or hardcoded hex values.

### Colours

| Token                             | Value                           | Usage                             |
| --------------------------------- | ------------------------------- | --------------------------------- |
| `--abyss`                         | `#030406`                       | Deepest backgrounds               |
| `--steel-0` through `--steel-6`   | `#0c0f16` → `#445260`           | Surface hierarchy                 |
| `--silver-0` through `--silver-4` | `#f0f4f8` → `#3a4a58`           | Text hierarchy                    |
| `--ember`                         | `#c8581a`                       | Primary accent — CTAs, highlights |
| `--ember-hi`                      | `#e07030`                       | Hover states on ember elements    |
| `--ember-lo`                      | `#7a3010`                       | Pressed states, subdued accents   |
| `--b0` through `--b3`             | `rgba(80,105,130,0.12)` → `0.6` | Border hierarchy                  |

### Typography

| Variable         | Font              | Used for                       |
| ---------------- | ----------------- | ------------------------------ |
| `--font-display` | Cinzel Decorative | Kingdom names, hero headings   |
| `--font-head`    | Cinzel            | Section titles, building names |
| `--font-body`    | EB Garamond       | Body text, descriptions        |
| `--font-lore`    | Spectral          | Italic lore text, flavour copy |

### Component classes

Use these utility classes from `globals.css` instead of repeating their styles:

```
.realm-display       Hero-scale display text
.realm-page-title    Section heading
.realm-lore          Italic body text
.realm-label         Uppercase metadata label
.realm-panel         Bordered surface card with inner glow
.realm-button        Base button — add -primary or -secondary
.realm-orb           Radial-gradient sphere indicator
.realm-divider       Horizontal separator line
```

### Dark mode only

The app has no light theme. Do not add `dark:` Tailwind variants or light-mode-specific colours. Every element must be readable on `#030406`.

---

## What We Welcome

- Bug fixes — especially those with a reproduction case in the issue
- Performance improvements to API routes with measurable before/after
- New building types with proper unlock conditions and game balance justification
- New achievements with clear, verifiable GitHub-data conditions
- Accessibility improvements (keyboard nav, screen reader support, focus management)
- Documentation improvements — typos, unclear sections, missing steps
- Translations — if you want to add i18n support, open an issue first to align on the approach
- Phaser scene improvements — visual polish, animation smoothness, isometric grid accuracy
- New leaderboard views backed by a proper Supabase view or function

---

## What We Will Not Merge

- Any change that allows client-side game state mutation
- Any new GitHub API call that bypasses the sync cache
- Pay-to-win mechanics — cosmetics only in the marketplace
- Loot boxes or randomised item drops from payments
- Light mode
- Any feature that silently degrades existing players' kingdoms
- Copy-pasted code that already exists elsewhere in the codebase
- Migrations that add tables without RLS
- Commits that contain `.env.local`, `node_modules/`, or `.npm-cache/`
- AI-generated code submitted without review, testing, or understanding

---

## Getting Help

- **Open an issue** for bugs or feature ideas
- **Start a Discussion** for architecture questions or "how does X work" questions
- **Read the code** — `src/lib/gameEngine.ts`, `src/lib/githubSync.ts`, and `src/types/game.ts` are the best starting points for understanding how the system fits together

---

<div align="center">

_Every great kingdom was built one commit at a time._

**MIT License · [dwakshar/commit-crown](https://github.com/dwakshar/commit-crown)**

</div>
