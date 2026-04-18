import Link from "next/link";
import { redirect } from "next/navigation";

import { GitHubSignInButton } from "@/src/components/auth/GitHubSignInButton";
import { HeroCanvas } from "@/src/components/ui/HeroCanvas";
import { createClient } from "@/utils/supabase/server";

const MARQUEE_ITEMS = [
  "GitHub Sync",
  "Kingdom Building",
  "7-Day Raids",
  "Global Leaderboard",
  "Achievement System",
  "62 Languages",
  "Live Battles",
  "Seasonal Campaigns",
  "Public Kingdom URLs",
  "Commit Streaks",
  "Passive Prestige",
  "Isometric Strategy",
];

const STEPS = [
  {
    num: "01",
    icon: "⚡",
    tag: "Connect",
    title: "Sign In With GitHub",
    desc: "OAuth in one click. We read your public contributions, commit history, streaks, languages, and repositories. Nothing is written.",
    hint: "Read-only OAuth. No password stored.",
  },
  {
    num: "02",
    icon: "🏰",
    tag: "Build",
    title: "Your Kingdom Rises",
    desc: "Every repo becomes a district. Every commit lays stone. Streaks fuel your armies. Your code history is the only currency that matters.",
    hint: "Auto-syncs every 24 hours.",
  },
  {
    num: "03",
    icon: "⚔️",
    tag: "Conquer",
    title: "Raid, Rank, Rule",
    desc: "Challenge rivals in 7-day wars decided by raw commit output. Climb the global leaderboard. Earn seasonal titles. Carve your name in iron.",
    hint: "No pay-to-win. Only commits decide wars.",
  },
];

const FEATURES = [
  {
    icon: "⚒️",
    title: "GitHub Forges Your Keep",
    desc: "Each commit adds stone. Each repository raises a new district. Every streak strengthens your walls against the siege of time.",
  },
  {
    icon: "⚔️",
    title: "Wage War on Rivals",
    desc: "Challenge kingdoms with equivalent code output. The battle lasts seven days. Only consistent commits determine the victor.",
  },
  {
    icon: "🏰",
    title: "Build Without Limit",
    desc: "Forge towers, granaries, training grounds, and observatories. Each structure grants prestige bonuses and passive abilities.",
  },
  {
    icon: "📜",
    title: "The Chronicle",
    desc: "An unbroken record of every language wielded, every milestone crossed. Your history cannot be erased — only extended.",
  },
  {
    icon: "🌍",
    title: "Explore Other Realms",
    desc: "Traverse the world map and visit allied kingdoms. Study their architecture. Challenge them. Forge pacts. Compete for dominance.",
  },
  {
    icon: "🏆",
    title: "Hall of Legend",
    desc: "The mightiest realms inscribed in the Hall of Legend. Weekly conquest. Seasonal campaigns. Your name carved in iron.",
  },
];

const MOCK_RANKS = [
  { rank: 1, ruler: "dragonheart_dev", kingdom: "Iron Bastion", prestige: "128,440", raids: "24W" },
  { rank: 2, ruler: "codesmith_rin", kingdom: "Silver Keep", prestige: "115,200", raids: "21W" },
  { rank: 3, ruler: "forge_master", kingdom: "Ember Citadel", prestige: "98,360", raids: "18W" },
  { rank: 4, ruler: "null_pointer_99", kingdom: "Shadow Hold", prestige: "87,100", raids: "15W" },
  { rank: 5, ruler: "bitweaver_k", kingdom: "Storm Rampart", prestige: "76,800", raids: "12W" },
];

const RANK_COLORS = [
  "text-[var(--ember)]",
  "text-[var(--plate-gleam)]",
  "text-[var(--plate-sheen)]",
  "text-[var(--silver-3)]",
  "text-[var(--silver-3)]",
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reason?: string }>;
}) {
  const { error, reason } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/kingdom");
  }

  const { count: kingdomCount } = await supabase
    .from("kingdoms")
    .select("id", { count: "exact", head: true });

  const authErrorMessage =
    error === "no_code"
      ? "GitHub sign-in did not return an authorization code."
      : error === "auth_failed"
      ? reason ?? "GitHub sign-in failed. Please try again."
      : error === "invalid_profile"
      ? "Your GitHub profile data could not be read."
      : error === "profile_lookup_failed"
      ? "We could not prepare your kingdom profile."
      : error === "profile_create_failed"
      ? "We could not save your profile."
      : error === "token_store_failed"
      ? "We could not store your GitHub access token."
      : null;

  return (
    <main className="min-h-screen overflow-x-hidden text-[var(--silver-1)] font-[var(--font-body)]">

      {/* ═══════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* ── Layer 1: Deep base gradient ── */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#030408_0%,#05070e_22%,#080d17_52%,#060910_78%,#030406_100%)]" />

        {/* ── Layer 2: Dot grid (masked to center fade) ── */}
        <div className="lp-dot-grid" />

        {/* ── Layer 3: Canvas star field ── */}
        <HeroCanvas />

        {/* ── Layer 4: Ambient ember orb (top center, breathing) ── */}
        <div className="lp-orb-ember" />

        {/* ── Layer 5: Cool steel orbs (left + right accents) ── */}
        <div className="lp-orb-steel-l" />
        <div className="lp-orb-steel-r" />

        {/* ── Layer 6: Perspective grid (horizon converging lines) ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMax slice"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 w-full h-full">
            {/* Radiating lines from vanishing point (center top) */}
            {[0, 160, 320, 480, 640, 720, 800, 960, 1120, 1280, 1440].map((bx, i) => (
              <line
                key={`r${i}`}
                x1={720} y1={0}
                x2={bx} y2={900}
                stroke="rgba(100,130,160,0.04)"
                strokeWidth="1"
              />
            ))}
            {/* Horizontal depth lines — narrow near top, full-width at bottom */}
            {[180, 320, 460, 580, 690, 780, 860].map((y, i) => {
              const d = y / 900
              const lx = +(720 - 720 * d).toFixed(1)
              const rx = +(720 + 720 * d).toFixed(1)
              const op = (d * 0.09).toFixed(3)
              return (
                <line
                  key={`h${i}`}
                  x1={lx} y1={y}
                  x2={rx} y2={y}
                  stroke={`rgba(100,130,160,${op})`}
                  strokeWidth="1"
                />
              )
            })}
          </svg>
        </div>

        {/* ── Layer 7: Mist drift layers ── */}
        <div className="absolute bottom-0 left-[-25%] right-[-25%] h-[48%] pointer-events-none bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(90,115,145,0.06)_0%,transparent_70%)] animate-[mist-drift_16s_ease-in-out_infinite_alternate]" style={{ zIndex: 5 }} />
        <div className="absolute bottom-[8%] left-[-15%] right-[-15%] h-[30%] pointer-events-none bg-[radial-gradient(ellipse_60%_100%_at_30%_100%,rgba(70,90,120,0.05)_0%,transparent_70%)] animate-[mist-drift_22s_ease-in-out_infinite_alternate-reverse]" style={{ zIndex: 5 }} />
        <div className="absolute bottom-[20%] left-0 right-0 h-[20%] pointer-events-none bg-[radial-gradient(ellipse_40%_100%_at_65%_100%,rgba(60,80,110,0.04)_0%,transparent_70%)] animate-[mist-drift_30s_ease-in-out_infinite_alternate]" style={{ zIndex: 5 }} />

        {/* ── Layer 8: Mountain + Castle SVG ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[62%] pointer-events-none" style={{ zIndex: 6 }}>
          <svg
            viewBox="0 0 1440 480"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full opacity-95">
            <defs>
              <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0e1620" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#030406" />
              </linearGradient>
              <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0a0e16" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#030406" />
              </linearGradient>
              <linearGradient id="mtn3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06080e" />
                <stop offset="100%" stopColor="#030406" />
              </linearGradient>
            </defs>
            <polygon
              points="0,480 90,220 180,285 310,140 420,230 550,85 680,175 800,65 920,145 1050,100 1160,185 1290,140 1380,195 1440,170 1440,480"
              fill="url(#mtn1)" opacity="0.6" />
            <polygon
              points="0,480 150,280 300,330 450,220 590,300 730,195 870,265 1020,200 1180,255 1340,215 1440,240 1440,480"
              fill="url(#mtn2)" opacity="0.85" />
            <polygon
              points="0,480 200,350 420,390 620,320 820,375 1000,305 1200,360 1440,330 1440,480"
              fill="url(#mtn3)" />
            {/* Castle body */}
            <rect x="590" y="370" width="260" height="20" fill="#040507" />
            <rect x="600" y="365" width="240" height="8"  fill="#06080c" />
            <rect x="605" y="300" width="230" height="70" fill="#050709" />
            <rect x="590" y="255" width="56"  height="115" fill="#060810" />
            <polygon points="590,240 646,240 634,205 602,205" fill="#04060a" />
            <rect x="794" y="255" width="56"  height="115" fill="#060810" />
            <polygon points="794,240 850,240 848,205 796,205" fill="#04060a" />
            <rect x="660" y="210" width="120" height="160" fill="#07090f" />
            <polygon points="660,202 780,202 770,160 670,160" fill="#05070c" />
            <rect x="707" y="140" width="26"  height="64"  fill="#08090f" />
            <polygon points="705,133 735,133 720,88" fill="#06080e" />
            <rect x="698" y="326" width="44"  height="44"  fill="#030405" />
            <ellipse cx="720" cy="326" rx="22" ry="14" fill="#030405" />
            {/* Castle windows — ember-lit */}
            <rect x="682" y="235" width="10" height="13" fill="#c85a1a" opacity="0.22" rx="1" />
            <rect x="748" y="235" width="10" height="13" fill="#c85a1a" opacity="0.19" rx="1" />
            <rect x="715" y="235" width="10" height="13" fill="#c85a1a" opacity="0.24" rx="1" />
            <ellipse cx="720" cy="370" rx="80" ry="12" fill="#c85a1a" opacity="0.07" />
          </svg>
        </div>

        {/* ── Layer 9: Castle ember pool glow ── */}
        <div className="lp-orb-castle" />

        {/* ── Layer 10: CSS ember particles rising from castle ── */}
        <div className="absolute pointer-events-none" style={{ bottom: '30%', left: '50%', transform: 'translateX(-50%)', width: '180px', height: 0, zIndex: 7 }}>
          {[
            { left: '10%', dur: '3.2s', delay: '0s',    drift: '18px'  },
            { left: '28%', dur: '4.0s', delay: '0.7s',  drift: '-14px' },
            { left: '45%', dur: '3.6s', delay: '1.4s',  drift: '22px'  },
            { left: '55%', dur: '4.4s', delay: '0.3s',  drift: '-20px' },
            { left: '70%', dur: '3.0s', delay: '1.1s',  drift: '12px'  },
            { left: '82%', dur: '4.8s', delay: '1.8s',  drift: '-16px' },
            { left: '35%', dur: '3.8s', delay: '2.2s',  drift: '24px'  },
            { left: '62%', dur: '3.4s', delay: '0.9s',  drift: '-10px' },
          ].map((e, i) => (
            <div
              key={i}
              className="absolute opacity-0 bg-[var(--ember)]"
              style={{
                left: e.left,
                width: i % 3 === 0 ? '2px' : '1.5px',
                height: i % 3 === 0 ? '2px' : '1.5px',
                animationName: 'ember-rise',
                animationDuration: e.dur,
                animationDelay: e.delay,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'ease-out',
                '--ember-drift': e.drift,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* ── Layer 11: Edge vignette ── */}
        <div className="lp-vignette" />

        {/* ── Navigation ── */}
        <nav className="relative flex items-center justify-between px-8 py-7" style={{ zIndex: 20 }}>
          <div className="flex items-center gap-3 font-[var(--font-head)] text-[15px] tracking-[0.05em] text-[var(--silver-0)]">
            <div className="realm-orb h-8 w-8 border border-[var(--b2)]" />
            CommitCrown
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Features",     href: "#features"     },
              { label: "Leaderboard",  href: "#leaderboard"  },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[11px] tracking-[0.2em] uppercase text-[var(--silver-3)] hover:text-[var(--silver-1)] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <a
            href="#enlist"
            className="realm-button realm-button-secondary border border-[var(--b1)] px-6 py-2.5 text-[11px] hidden sm:block">
            Enter the Realm
          </a>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6 text-center pb-24" style={{ zIndex: 10 }}>

          <div className="lp-hero-badge mb-8 inline-flex items-center gap-3 border border-[var(--b1)] bg-[rgba(16,20,30,0.8)] px-5 py-2 backdrop-blur-[2px]">
            <span className="w-1.5 h-1.5 bg-[var(--ember)] inline-block animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[var(--silver-2)] font-[var(--font-head)]">
              GitHub → Kingdom → Legend
            </span>
          </div>

          <h1 className="lp-hero-h1 realm-display text-[clamp(56px,10vw,108px)] font-bold leading-[0.92] tracking-[-0.02em] text-[var(--silver-0)]">
            Commit<span className="text-[var(--ember)]">Crown</span>
          </h1>

          <div className="lp-hero-tagline mt-6 flex items-center gap-5 text-[11px] uppercase tracking-[0.42em] text-[var(--plate-hi)]">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-[var(--steel-6)]" />
            Your Code. Your Kingdom.
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-[var(--steel-6)]" />
          </div>

          <p className="lp-hero-body realm-lore mt-7 max-w-xl text-[clamp(16px,2vw,19px)] leading-relaxed text-[var(--silver-2)]">
            Every commit lays stone. Every repository raises a tower. Your
            GitHub history builds a realm that breathes, battles, and endures.
          </p>

          <div id="enlist" className="lp-hero-cta mt-10 flex flex-col sm:flex-row gap-4 items-center">
            <GitHubSignInButton initialError={authErrorMessage} />
            <Link
              href="#how-it-works"
              className="realm-button realm-button-secondary border border-[var(--b1)] px-10 py-4 text-sm">
              See How It Works
            </Link>
          </div>

          <p className="lp-hero-sub mt-5 text-xs tracking-[0.14em] uppercase text-[var(--silver-4)]">
            Free forever · No credit card · Only commits
          </p>
        </div>

        {/* ── Scroll indicator ── */}
        <a
          href="#how-it-works"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--silver-4)] hover:text-[var(--silver-2)] transition-colors"
          style={{ zIndex: 20 }}>
          SCROLL
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* ═══════════════════════════════════════════════
          MARQUEE TICKER
          ═══════════════════════════════════════════════ */}
      <div className="border-y border-[var(--b0)] bg-[var(--steel-0)] py-4 overflow-hidden">
        <div className="lp-ticker-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 px-8 text-[10px] tracking-[0.22em] uppercase text-[var(--silver-4)] whitespace-nowrap">
              <span className="w-1 h-1 bg-[var(--ember-lo)] inline-block flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════════ */}
      <div className="border-b border-[var(--b1)] bg-[linear-gradient(180deg,var(--steel-1)_0%,var(--steel-2)_100%)] py-16">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4">
          {[
            { value: (kingdomCount ?? 0).toLocaleString(), label: "Kingdoms Forged" },
            { value: "120K+", label: "Commits Chronicled" },
            { value: "18K+", label: "Raids Waged" },
            { value: "62", label: "Languages of War" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center px-6 py-2 ${i < 3 ? "border-r border-[var(--b0)]" : ""}`}>
              <div className="font-[var(--font-display)] text-[clamp(2rem,4vw,3rem)] text-[var(--silver-0)] leading-none">
                {stat.value}
              </div>
              <div className="mt-3 text-[10px] tracking-[0.26em] uppercase text-[var(--silver-3)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 py-28 bg-[var(--abyss)] border-b border-[var(--b0)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-5 mb-5">
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
              <span className="realm-label text-[var(--silver-3)]">The Path to Power</span>
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
            </div>
            <h2 className="realm-page-title text-[clamp(2rem,5vw,3.4rem)] font-bold text-[var(--silver-0)]">
              From Code to Crown
            </h2>
            <p className="realm-lore mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--silver-2)]">
              Three forces drive the realm. Three steps separate a coder from a king.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[var(--b0)] border border-[var(--b1)] overflow-hidden">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="relative bg-[var(--steel-1)] p-10 xl:p-12 group hover:bg-[var(--steel-2)] transition-colors overflow-hidden">
                {/* Ghost number */}
                <div className="absolute top-4 right-6 font-[var(--font-display)] text-[6rem] leading-none text-[var(--steel-3)] select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="text-3xl mb-5">{step.icon}</div>
                <div className="font-[var(--font-head)] text-[10px] tracking-[0.22em] uppercase text-[var(--ember)] mb-3">
                  Step {step.num} — {step.tag}
                </div>
                <h3 className="font-[var(--font-head)] text-[1.15rem] text-[var(--silver-0)] mb-4 leading-snug">
                  {step.title}
                </h3>
                <p className="text-[var(--silver-2)] leading-relaxed text-sm">
                  {step.desc}
                </p>
                <div className="mt-7 pt-5 border-t border-[var(--b0)] text-[10px] tracking-[0.18em] uppercase text-[var(--steel-6)]">
                  {step.hint}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          KINGDOM PREVIEW
          ═══════════════════════════════════════════════ */}
      <section className="px-6 py-28 bg-[var(--steel-0)] border-b border-[var(--b0)]">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-center">

            {/* Game window mockup */}
            <div className="lp-game-window order-2 lg:order-1">
              {/* Title bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--b1)] bg-[var(--steel-2)]">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-[var(--steel-4)]" />
                  <div className="w-2.5 h-2.5 bg-[var(--steel-4)]" />
                  <div className="w-2.5 h-2.5 bg-[var(--ember-lo)]" />
                </div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--silver-3)]">
                  IRON BASTION — Level 8
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--ember)]">
                  <span className="w-1.5 h-1.5 bg-[var(--ember)] inline-block animate-[pulse_2s_ease-in-out_infinite]" />
                  LIVE
                </div>
              </div>

              {/* Resources */}
              <div className="px-6 py-5 border-b border-[var(--b0)]">
                <div className="text-[9px] tracking-[0.24em] uppercase text-[var(--silver-3)] mb-4">
                  Kingdom Resources
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "Treasury", value: "2,400 Gold", pct: 80 },
                    { label: "Army", value: "1,200 Troops", pct: 60 },
                    { label: "Granary", value: "4,800 Food", pct: 90 },
                    { label: "Prestige", value: "12,400 pts", pct: 82 },
                  ].map((res) => (
                    <div key={res.label}>
                      <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-[var(--silver-3)] tracking-[0.1em] uppercase">{res.label}</span>
                        <span className="text-[var(--silver-2)]">{res.value}</span>
                      </div>
                      <div className="h-[3px] bg-[var(--steel-4)] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--ember-lo)] to-[var(--ember)]"
                          style={{ width: `${res.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structures + Commits */}
              <div className="grid grid-cols-2 divide-x divide-[var(--b0)]">
                <div className="px-5 py-4">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-[var(--silver-3)] mb-3">
                    Structures
                  </div>
                  {[
                    { name: "Barracks", level: 3, icon: "⚔" },
                    { name: "Tower", level: 5, icon: "🏰" },
                    { name: "Library", level: 2, icon: "📚" },
                    { name: "Observatory", level: 4, icon: "🔭" },
                  ].map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between py-2 border-b border-[var(--b0)] last:border-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--silver-1)]">
                        <span className="text-sm">{s.icon}</span>
                        {s.name}
                      </div>
                      <span className="text-[10px] text-[var(--ember)]">Lv {s.level}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4">
                  <div className="text-[9px] tracking-[0.22em] uppercase text-[var(--silver-3)] mb-3">
                    Recent Commits
                  </div>
                  {[
                    { msg: "feat: add auth endpoint", lang: "TS" },
                    { msg: "fix: resolve memory leak", lang: "Go" },
                    { msg: "refactor: clean services", lang: "TS" },
                    { msg: "docs: update README", lang: "MD" },
                  ].map((c, i) => (
                    <div key={i} className="py-2 border-b border-[var(--b0)] last:border-0">
                      <div className="text-[11px] text-[var(--silver-2)] truncate">{c.msg}</div>
                      <div className="text-[9px] text-[var(--plate-hi)] mt-0.5 uppercase tracking-[0.1em]">{c.lang}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--b1)] bg-[var(--steel-2)]">
                {[
                  { label: "Streak", value: "14 days", color: "text-[var(--ember)]" },
                  { label: "Languages", value: "5 active", color: "text-[var(--plate-sheen)]" },
                  { label: "Raids", value: "12W / 3L", color: "text-[var(--silver-1)]" },
                ].map((s) => (
                  <span key={s.label} className="text-[10px] tracking-[0.14em] uppercase text-[var(--silver-3)]">
                    {s.label}:{" "}
                    <span className={s.color}>{s.value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Text content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-[var(--ember)]" />
                <span className="realm-label text-[var(--silver-3)]">The Realm</span>
              </div>
              <h2 className="realm-page-title text-[clamp(2rem,4vw,3rem)] font-bold text-[var(--silver-0)] mb-6 leading-tight">
                A Living Kingdom,<br />Forged in Code
              </h2>
              <p className="realm-lore text-[15px] leading-relaxed text-[var(--silver-2)] mb-8">
                Your GitHub history doesn&apos;t disappear into a timeline. It becomes
                architecture — walls, towers, armies. Every language you master,
                every streak you maintain, every project you ship builds a realm
                that is uniquely, permanently yours.
              </p>
              <ul className="space-y-3">
                {[
                  "Repositories map to kingdom districts",
                  "Commit streaks determine army strength",
                  "Language diversity unlocks new buildings",
                  "Stars and forks generate passive prestige",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-4 text-sm text-[var(--silver-2)]">
                    <span className="mt-1 w-4 h-4 border border-[var(--ember)] flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 bg-[var(--ember)] block" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════════ */}
      <section id="features" className="px-6 py-28 bg-[var(--abyss)] border-b border-[var(--b0)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-6 text-[var(--silver-3)] text-xs uppercase tracking-[0.25em] mb-5">
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--b2)] to-transparent" />
              The Pillars of the Realm
              <div className="h-px w-10 bg-gradient-to-l from-transparent via-[var(--b2)] to-transparent" />
            </div>
            <h2 className="realm-page-title text-[clamp(2.2rem,5vw,3.6rem)] font-bold text-[var(--silver-0)]">
              How The Kingdom Is Forged
            </h2>
            <p className="realm-lore mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--silver-2)]">
              From raw commits to castle spires — your craft is the only
              currency that matters in this realm.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="feature-card">
                <span className="feat-icon">{feat.icon}</span>
                <div className="feat-title">{feat.title}</div>
                <p className="feat-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          LEADERBOARD PREVIEW
          ═══════════════════════════════════════════════ */}
      <section id="leaderboard" className="px-6 py-28 bg-[var(--steel-0)] border-b border-[var(--b0)]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-5 mb-5">
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
              <span className="realm-label text-[var(--silver-3)]">Hall of Legend</span>
              <div className="h-px w-10 bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
            </div>
            <h2 className="realm-page-title text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-[var(--silver-0)]">
              The Mightiest Realms
            </h2>
            <p className="realm-lore mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--silver-2)]">
              No purchases. No shortcuts. Only those who commit — day after day —
              rise to legend.
            </p>
          </div>

          <div className="border border-[var(--b1)] overflow-hidden bg-[var(--steel-1)]">
            {/* Header row */}
            <div className="grid grid-cols-[2.5rem_1fr_1fr_auto_auto] gap-6 px-6 py-3 border-b border-[var(--b1)] bg-[var(--steel-2)]">
              {["#", "Ruler", "Kingdom", "Prestige", "Raids"].map((h) => (
                <div key={h} className="realm-label text-[9px] text-[var(--silver-4)]">
                  {h}
                </div>
              ))}
            </div>

            {MOCK_RANKS.map((row, idx) => (
              <div
                key={row.rank}
                className="grid grid-cols-[2.5rem_1fr_1fr_auto_auto] gap-6 items-center px-6 py-4 border-b border-[var(--b0)] last:border-0 hover:bg-[var(--steel-glow)] transition-colors">
                <div className={`font-[var(--font-head)] text-sm ${RANK_COLORS[idx]}`}>
                  {row.rank}
                </div>
                <div className="text-sm text-[var(--silver-1)] truncate">{row.ruler}</div>
                <div className="text-sm text-[var(--silver-2)] truncate">{row.kingdom}</div>
                <div className="text-sm font-[var(--font-head)] text-[var(--silver-0)]">
                  {row.prestige}
                </div>
                <div className="text-xs font-[var(--font-head)] text-[var(--ember)]">
                  {row.raids}
                </div>
              </div>
            ))}

            <div className="px-6 py-4 border-t border-[var(--b1)] bg-[var(--steel-2)] flex items-center justify-between">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--silver-4)]">
                Updated weekly · Season I of IV
              </span>
              <a
                href="#enlist"
                className="text-[10px] tracking-[0.2em] uppercase text-[var(--ember)] hover:text-[var(--ember-hi)] transition-colors">
                Join the ranks →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════ */}
      <section className="relative px-6 py-36 overflow-hidden border-b border-[var(--b0)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(200,88,26,0.07)_0%,transparent_70%),linear-gradient(180deg,var(--abyss)_0%,var(--steel-1)_50%,var(--abyss)_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--steel-6)] to-transparent" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-6 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-[var(--ember-lo)] to-transparent" />
            <span className="realm-label text-[var(--silver-4)]">Begin Your Reign</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-[var(--ember-lo)] to-transparent" />
          </div>

          <h2 className="realm-page-title text-[clamp(2.4rem,6vw,4.8rem)] font-bold text-[var(--silver-0)] mb-6">
            Claim Your Keep
          </h2>

          <p className="realm-lore mx-auto max-w-md text-[17px] leading-relaxed text-[var(--silver-2)] mb-12">
            Your GitHub history is already a kingdom waiting to be born.
            One sign-in is all it takes to raise your walls.
          </p>

          <div className="flex flex-col items-center gap-5">
            <GitHubSignInButton initialError={authErrorMessage} />
            <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--silver-4)]">
              Free forever · No credit card · Only commits
            </p>
          </div>

          <div className="mt-20 pt-12 border-t border-[var(--b0)] grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                label: "Always Free",
                desc: "No paywalls. No premium tiers. Code is the only currency.",
              },
              {
                label: "GitHub OAuth",
                desc: "We never store passwords. Read-only access to public data.",
              },
              {
                label: "Open Progress",
                desc: "Your kingdom URL is public. Share it. Let rivals study it.",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="font-[var(--font-head)] text-[11px] tracking-[0.14em] uppercase text-[var(--silver-0)] mb-2">
                  {item.label}
                </div>
                <div className="text-xs text-[var(--silver-3)] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════ */}
      <footer className="border-t border-[var(--b0)] bg-[var(--abyss)] px-8 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-[var(--font-head)] text-sm text-[var(--silver-3)]">
            <div className="realm-orb h-5 w-5 border border-[var(--b1)]" />
            CommitCrown
          </div>
          <p className="text-[10px] tracking-[0.1em] text-[var(--silver-4)] text-center">
            Turn code into conquest. No subscriptions. No shortcuts. Only commits.
          </p>
          <div className="flex gap-6">
            {[
              { label: "Features", href: "#features" },
              { label: "Leaderboard", href: "#leaderboard" },
              { label: "Sign In", href: "#enlist" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[10px] tracking-[0.16em] uppercase text-[var(--silver-4)] hover:text-[var(--silver-2)] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
