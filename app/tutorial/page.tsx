import Link from "next/link";
import { TutorialNav } from "@/src/components/ui/TutorialNav";
import { GitHubSignInButton } from "@/src/components/auth/GitHubSignInButton";

export const metadata = {
  title: "The Ruler's Handbook · CommitCrown",
  description:
    "A complete step-by-step guide to CommitCrown — from signing in with GitHub to conquering the global leaderboard.",
};

/* ─── Shared prose primitives ─── */
function StepNumber({ n }: { n: string }) {
  return (
    <div className="tut-step-num">
      {n}
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="tut-tip">
      <span className="tut-tip-label">TIP</span>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="tut-note">
      <span className="tut-note-label">NOTE</span>
      {children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="tut-warning">
      <span className="tut-warning-label">IMPORTANT</span>
      {children}
    </div>
  );
}

/* ─── Inline game-UI mockups (CSS, no images required) ─── */

function MockOAuth() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">github.com · OAuth Authorization</span>
      </div>
      <div className="tut-mock-body flex flex-col items-center gap-5 py-10">
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--silver-0)]">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
          </svg>
          <span className="font-[var(--font-head)] text-[var(--silver-0)] text-lg">GitHub</span>
        </div>
        <p className="text-sm text-[var(--silver-2)] text-center max-w-xs">
          CommitCrown is requesting permission to access your <strong className="text-[var(--silver-0)]">public profile</strong> and <strong className="text-[var(--silver-0)]">repository data</strong>.
        </p>
        <div className="w-full max-w-xs border border-[var(--b1)] p-3 space-y-2">
          {["read:user — public profile info", "repo — public repository list"].map(s => (
            <div key={s} className="flex items-center gap-2 text-xs text-[var(--silver-3)]">
              <span className="w-3 h-3 bg-[var(--ember)] opacity-60 flex-shrink-0" />
              {s}
            </div>
          ))}
        </div>
        <button className="realm-button realm-button-primary px-8 py-2.5 text-sm w-full max-w-xs">
          Authorize CommitCrown
        </button>
        <p className="text-[10px] text-[var(--silver-4)] uppercase tracking-widest">
          Read-only · No write access · No password stored
        </p>
      </div>
    </div>
  );
}

function MockKingdomCreation() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">commitcrown.app · Analyzing your realm…</span>
      </div>
      <div className="tut-mock-body py-8 px-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="font-[var(--font-head)] text-[var(--ember)] text-[10px] tracking-widest uppercase">Scanning GitHub History</div>
          <h3 className="font-[var(--font-display)] text-2xl text-[var(--silver-0)]">Your Kingdom Awaits</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Repositories scanned", value: "34", pct: 100, done: true },
            { label: "Commits analysed", value: "4,820", pct: 100, done: true },
            { label: "Languages detected", value: "7", pct: 100, done: true },
            { label: "Streak history loaded", value: "62 days", pct: 80, done: false },
          ].map(row => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--silver-3)]">{row.label}</span>
                <span className={row.done ? "text-[var(--ember)]" : "text-[var(--silver-2)]"}>{row.value}</span>
              </div>
              <div className="h-px bg-[var(--b0)] relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--ember-lo)] to-[var(--ember)]"
                  style={{ width: `${row.pct}%`, transition: "width 1.2s ease" }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border border-[var(--b1)] p-3 text-center space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-[var(--steel-6)]">Your Kingdom URL</div>
          <div className="font-[var(--font-head)] text-[var(--silver-1)] text-sm">commitcrown.app/realm/<span className="text-[var(--ember)]">your-github-username</span></div>
        </div>
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">commitcrown.app/kingdom</span>
      </div>
      <div className="tut-mock-body">
        {/* HUD top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--b0)] bg-[var(--steel-2)] text-[10px]">
          <span className="font-[var(--font-head)] text-[var(--silver-0)]">Iron Bastion</span>
          <div className="flex gap-4">
            {[
              { icon: "⚒️", v: "4,820" },
              { icon: "🌲", v: "34"    },
              { icon: "🪨", v: "62"    },
              { icon: "🌾", v: "128K"  },
            ].map(r => (
              <div key={r.icon} className="flex items-center gap-1 text-[var(--silver-2)]">
                <span>{r.icon}</span>
                <span className="font-[var(--font-head)] text-[var(--silver-0)]">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[var(--ember)]">
            <span>⚔️</span>
            <span className="font-[var(--font-head)]">18,400 PWR</span>
          </div>
        </div>
        {/* Isometric placeholder */}
        <div className="relative h-44 bg-[var(--steel-0)] overflow-hidden">
          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--abyss)] to-transparent" />
          {/* Simple isometric grid lines */}
          {[...Array(6)].map((_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-[var(--b0)]" style={{ top: `${i * 30}px` }} />
          ))}
          {[...Array(8)].map((_, i) => (
            <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-[var(--b0)]" style={{ left: `${i * 60}px` }} />
          ))}
          {/* Building tiles */}
          {[
            { top: "30px", left: "80px",  label: "🏦", name: "Treasury"  },
            { top: "30px", left: "200px", label: "⚔️", name: "Barracks"  },
            { top: "60px", left: "140px", label: "🏰", name: "Keep"      },
            { top: "70px", left: "300px", label: "🗼", name: "Tower"     },
          ].map(b => (
            <div key={b.name} className="absolute flex flex-col items-center gap-0.5" style={{ top: b.top, left: b.left }}>
              <span className="text-xl">{b.label}</span>
              <span className="text-[8px] text-[var(--silver-4)] uppercase tracking-wide">{b.name}</span>
            </div>
          ))}
          {/* Prestige label */}
          <div className="absolute top-3 right-3 border border-[var(--b1)] bg-[rgba(6,8,14,0.8)] px-2 py-1 text-[9px] text-[var(--silver-2)]">
            Prestige <span className="text-[var(--ember)] font-[var(--font-head)]">128,440</span>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="flex gap-2 p-3 border-t border-[var(--b0)]">
          {["BUILD", "SYNC", "RAID", "WORLD", "SHOP"].map(btn => (
            <button key={btn} className="flex-1 py-1.5 border border-[var(--b1)] text-[9px] tracking-widest uppercase text-[var(--silver-3)] hover:border-[var(--ember)] hover:text-[var(--ember)] transition-colors">
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockResources() {
  const resources = [
    { icon: "⚒️", name: "Gold",     value: "4,820",  desc: "From commits",       color: "#c89030" },
    { icon: "🌲", name: "Wood",     value: "34",     desc: "From repositories",  color: "#408040" },
    { icon: "🪨", name: "Stone",    value: "62",     desc: "From streak days",   color: "#8090a0" },
    { icon: "🌾", name: "Food",     value: "128,400",desc: "From lines of code", color: "#c0a040" },
    { icon: "✨", name: "Prestige", value: "18,440", desc: "Overall power score", color: "#c8581a" },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Resources Panel</span>
      </div>
      <div className="tut-mock-body p-5 space-y-2">
        {resources.map(r => (
          <div key={r.name} className="flex items-center gap-3 border border-[var(--b0)] p-3 hover:border-[var(--b1)] transition-colors">
            <span className="text-xl w-8 text-center">{r.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-[var(--font-head)] text-[11px] text-[var(--silver-0)] uppercase tracking-wide">{r.name}</span>
                <span className="font-[var(--font-head)] text-[11px]" style={{ color: r.color }}>{r.value}</span>
              </div>
              <div className="text-[10px] text-[var(--silver-4)] mt-0.5">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockBuildMenu() {
  const buildings = [
    { icon: "⚔️", name: "Barracks",    cost: "500 Gold",  bonus: "+Army Power",  locked: false },
    { icon: "🏦", name: "Treasury",    cost: "800 Gold",  bonus: "+Gold/hr",     locked: false },
    { icon: "🌾", name: "Granary",     cost: "600 Wood",  bonus: "+Food cap",    locked: false },
    { icon: "🗼", name: "Watch Tower", cost: "400 Stone", bonus: "+Raid defense",locked: false },
    { icon: "📚", name: "Library",     cost: "1200 Gold", bonus: "+Tech bonus",  locked: true  },
    { icon: "🔭", name: "Observatory", cost: "2000 Gold", bonus: "+Prestige/hr", locked: true  },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Build Menu</span>
      </div>
      <div className="tut-mock-body p-4">
        <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)] mb-3">Select a building to place</div>
        <div className="grid grid-cols-2 gap-2">
          {buildings.map(b => (
            <div key={b.name} className={`border p-3 space-y-1 transition-colors ${b.locked ? "border-[var(--b0)] opacity-40" : "border-[var(--b1)] hover:border-[var(--ember)]"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{b.icon}</span>
                <span className="font-[var(--font-head)] text-[10px] text-[var(--silver-0)] uppercase">{b.name}</span>
                {b.locked && <span className="ml-auto text-[8px] text-[var(--steel-6)] border border-[var(--steel-6)] px-1">LOCKED</span>}
              </div>
              <div className="text-[9px] text-[var(--ember)]">{b.cost}</div>
              <div className="text-[9px] text-[var(--silver-4)]">{b.bonus}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockUpgrade() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Barracks — Upgrade</span>
      </div>
      <div className="tut-mock-body p-5">
        <div className="flex items-start gap-4 mb-5">
          <span className="text-4xl">⚔️</span>
          <div>
            <div className="font-[var(--font-head)] text-[var(--silver-0)] text-sm">Barracks</div>
            <div className="text-[10px] text-[var(--silver-3)] mt-0.5">Trains soldiers from your commit streak</div>
          </div>
        </div>
        {/* Level bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-[var(--silver-3)]">Current Level</span>
            <span className="font-[var(--font-head)] text-[var(--ember)]">Level 4 / 10</span>
          </div>
          <div className="h-2 bg-[var(--steel-3)] relative">
            <div className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-[var(--ember-lo)] to-[var(--ember)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Current output", value: "+680 PWR" },
            { label: "After upgrade",  value: "+816 PWR" },
            { label: "Upgrade cost",   value: "1,200 Gold" },
            { label: "Multiplier",     value: "×1.2 / level" },
          ].map(s => (
            <div key={s.label} className="border border-[var(--b0)] p-2.5">
              <div className="text-[9px] text-[var(--silver-4)] uppercase tracking-wide">{s.label}</div>
              <div className="font-[var(--font-head)] text-[11px] text-[var(--silver-0)] mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
        <button className="w-full realm-button realm-button-primary py-2.5 text-sm">
          Upgrade to Level 5
        </button>
      </div>
    </div>
  );
}

function MockStreaks() {
  const tiers = [
    { days: "1 – 7",  unit: "Infantry",    icon: "🗡️",  power: "Base",    color: "#6a7e8e" },
    { days: "8 – 14", unit: "Cavalry",     icon: "🐴",  power: "+35%",   color: "#8090a0" },
    { days: "15 – 30",unit: "Siege",       icon: "💣",  power: "+80%",   color: "#c8a040" },
    { days: "31+",    unit: "Elite Guard", icon: "👑",  power: "+150%",  color: "#c8581a" },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Streak Panel · Current: 23 days 🔥</span>
      </div>
      <div className="tut-mock-body p-5 space-y-3">
        {tiers.map((t, i) => (
          <div
            key={t.days}
            className={`flex items-center gap-4 border p-3 transition-colors ${i === 2 ? "border-[var(--ember)] bg-[rgba(200,88,26,0.06)]" : "border-[var(--b0)]"}`}>
            <span className="text-2xl w-10 text-center">{t.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-[var(--font-head)] text-[10px] uppercase tracking-wide" style={{ color: t.color }}>{t.unit}</span>
                <span className="text-[10px] font-[var(--font-head)] text-[var(--silver-0)]">{t.power}</span>
              </div>
              <div className="text-[9px] text-[var(--silver-4)] mt-0.5">{t.days} day streak</div>
            </div>
            {i === 2 && <span className="text-[9px] border border-[var(--ember)] text-[var(--ember)] px-1.5 py-0.5">ACTIVE</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSync() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">GitHub Sync</span>
      </div>
      <div className="tut-mock-body p-6 space-y-5">
        <div className="border border-[var(--b1)] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--silver-3)]">Last sync</span>
            <span className="text-[var(--silver-0)] font-[var(--font-head)]">Today · 00:00 UTC</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--silver-3)]">Next auto-sync</span>
            <span className="text-[var(--silver-0)] font-[var(--font-head)]">Tomorrow · 00:00 UTC</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--silver-3)]">Manual sync cooldown</span>
            <span className="text-[var(--ember)] font-[var(--font-head)]">47 min remaining</span>
          </div>
        </div>
        <div className="border border-[var(--b0)] p-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)] mb-2">Last sync result</div>
          {[
            "✓  +12 new commits detected",
            "✓  Streak extended to 23 days",
            "✓  Repository 'commit-crown' updated",
            "✓  Gold resource +240",
          ].map(l => (
            <div key={l} className="text-[11px] text-[var(--silver-3)]">{l}</div>
          ))}
        </div>
        <button className="w-full realm-button realm-button-secondary border border-[var(--b1)] py-2.5 text-sm opacity-50 cursor-not-allowed">
          Manual Sync (cooldown)
        </button>
      </div>
    </div>
  );
}

function MockWorldMap() {
  const kingdoms = [
    { name: "Iron Bastion",   ruler: "dragonheart",  prestige: "128K", x: "18%", y: "30%" },
    { name: "Silver Keep",    ruler: "codesmith_rin", prestige: "115K", x: "55%", y: "20%" },
    { name: "Ember Citadel",  ruler: "forge_master",  prestige: "98K",  x: "70%", y: "55%" },
    { name: "Your Kingdom",   ruler: "you",           prestige: "18K",  x: "38%", y: "62%", self: true },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">World Map · 1,240 Realms</span>
      </div>
      <div className="tut-mock-body relative h-56 bg-[var(--steel-0)]">
        {/* Grid */}
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-[var(--b0)]" style={{ top: `${i * 37}px` }} />
        ))}
        {[...Array(8)].map((_, i) => (
          <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-[var(--b0)]" style={{ left: `${i * 52}px` }} />
        ))}
        {kingdoms.map(k => (
          <div
            key={k.name}
            className="absolute"
            style={{ left: k.x, top: k.y }}>
            <div className={`flex flex-col items-center gap-0.5 cursor-pointer group`}>
              <span className={`text-base ${k.self ? "filter drop-shadow-[0_0_6px_rgba(200,88,26,0.8)]" : ""}`}>
                {k.self ? "⭐" : "🏰"}
              </span>
              <div className={`text-[8px] px-1.5 py-0.5 ${k.self ? "bg-[var(--ember)] text-white" : "bg-[rgba(6,8,14,0.8)] text-[var(--silver-3)]"} border ${k.self ? "border-[var(--ember)]" : "border-[var(--b1)]"} whitespace-nowrap`}>
                {k.name}
              </div>
            </div>
          </div>
        ))}
        {/* Legend */}
        <div className="absolute bottom-2 right-2 border border-[var(--b0)] bg-[rgba(6,8,14,0.8)] p-1.5 space-y-1">
          <div className="flex items-center gap-1 text-[8px] text-[var(--silver-4)]">
            <span>🏰</span> Other realm
          </div>
          <div className="flex items-center gap-1 text-[8px] text-[var(--ember)]">
            <span>⭐</span> Your realm
          </div>
        </div>
      </div>
    </div>
  );
}

function MockRaidInit() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Initiate Raid · Silver Keep</span>
      </div>
      <div className="tut-mock-body p-5 space-y-4">
        <div className="flex gap-4 border border-[var(--b0)] p-3">
          <div className="flex-1 text-center space-y-1">
            <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)]">Your Kingdom</div>
            <div className="font-[var(--font-head)] text-[var(--silver-0)]">Iron Bastion</div>
            <div className="text-[10px] text-[var(--ember)]">18,400 PWR</div>
          </div>
          <div className="flex items-center text-[var(--silver-4)] font-[var(--font-head)] text-xl">⚔️</div>
          <div className="flex-1 text-center space-y-1">
            <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)]">Target Kingdom</div>
            <div className="font-[var(--font-head)] text-[var(--silver-0)]">Silver Keep</div>
            <div className="text-[10px] text-[var(--silver-2)]">16,200 PWR</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)]">Select Strategy</div>
          {[
            { name: "Siege",       desc: "Slow but devastating. +40% to attack.",         selected: true  },
            { name: "Skirmish",    desc: "Fast raids. Commit volume decides the winner.", selected: false },
            { name: "Infiltration",desc: "Targets their weakest resource.",               selected: false },
          ].map(s => (
            <div key={s.name} className={`border p-3 cursor-pointer transition-colors ${s.selected ? "border-[var(--ember)] bg-[rgba(200,88,26,0.06)]" : "border-[var(--b0)]"}`}>
              <div className="font-[var(--font-head)] text-[10px] uppercase text-[var(--silver-0)]">{s.name}</div>
              <div className="text-[9px] text-[var(--silver-4)] mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
        <button className="w-full realm-button realm-button-primary py-2.5 text-sm">
          Declare War · 7-Day Raid
        </button>
        <p className="text-[9px] text-center text-[var(--silver-4)] uppercase tracking-wide">1 active raid at a time · Cannot be cancelled</p>
      </div>
    </div>
  );
}

function MockRaidProgress() {
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Active Raid · Day 4 of 7</span>
      </div>
      <div className="tut-mock-body p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-[var(--silver-3)]">Raid Progress</span>
            <span className="font-[var(--font-head)] text-[var(--ember)]">Day 4 / 7</span>
          </div>
          <div className="h-2 bg-[var(--steel-3)]">
            <div className="h-full w-[57%] bg-gradient-to-r from-[var(--ember-lo)] to-[var(--ember)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-[var(--b1)] p-3 text-center">
            <div className="text-[9px] text-[var(--silver-4)] uppercase">Your Raid Points</div>
            <div className="font-[var(--font-head)] text-xl text-[var(--ember)] mt-1">2,840</div>
            <div className="text-[8px] text-[var(--silver-4)] mt-0.5">48 commits × 59.2</div>
          </div>
          <div className="border border-[var(--b0)] p-3 text-center">
            <div className="text-[9px] text-[var(--silver-4)] uppercase">Enemy Points</div>
            <div className="font-[var(--font-head)] text-xl text-[var(--silver-2)] mt-1">1,960</div>
            <div className="text-[8px] text-[var(--silver-4)] mt-0.5">36 commits × 54.4</div>
          </div>
        </div>
        <div className="border border-[var(--b0)] p-3 space-y-1">
          <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)] mb-2">Daily Activity Feed</div>
          {[
            "Day 4: +640 pts — 11 commits pushed",
            "Day 3: +720 pts — 13 commits pushed",
            "Day 2: +880 pts — 14 commits pushed",
          ].map(l => (
            <div key={l} className="text-[10px] text-[var(--silver-3)]">▸ {l}</div>
          ))}
        </div>
        <div className="border border-[var(--ember)] bg-[rgba(200,88,26,0.06)] p-3 text-center">
          <div className="text-[10px] text-[var(--ember)] font-[var(--font-head)]">YOU ARE WINNING</div>
          <div className="text-[9px] text-[var(--silver-3)] mt-1">Keep committing to secure victory — 3 days remain</div>
        </div>
      </div>
    </div>
  );
}

function MockLeaderboard() {
  const rows = [
    { rank: 1, ruler: "dragonheart_dev",  kingdom: "Iron Bastion",  prestige: "128,440", tier: "⚜️ Legend",   color: "#c8581a" },
    { rank: 2, ruler: "codesmith_rin",    kingdom: "Silver Keep",   prestige: "115,200", tier: "⚜️ Legend",   color: "#b0c4d6" },
    { rank: 3, ruler: "forge_master",     kingdom: "Ember Citadel", prestige: "98,360",  tier: "🏆 Champion",  color: "#8fa4b8" },
    { rank: 4, ruler: "null_pointer_99",  kingdom: "Shadow Hold",   prestige: "87,100",  tier: "🛡️ Knight",    color: "#6a7e8e" },
    { rank: 5, ruler: "you",             kingdom: "Your Kingdom",  prestige: "18,440",  tier: "🪖 Recruit",   color: "#6a7e8e", self: true },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Global Leaderboard · Season I</span>
      </div>
      <div className="tut-mock-body">
        <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-4 py-2 border-b border-[var(--b1)] bg-[var(--steel-2)] text-[8px] uppercase tracking-widest text-[var(--silver-4)]">
          <span>#</span><span>Ruler</span><span>Prestige</span><span>Tier</span>
        </div>
        {rows.map((row) => (
          <div key={row.rank} className={`grid grid-cols-[2rem_1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-[var(--b0)] last:border-0 ${row.self ? "bg-[rgba(200,88,26,0.05)]" : ""}`}>
            <span className="font-[var(--font-head)] text-[11px]" style={{ color: row.color }}>{row.rank}</span>
            <div>
              <div className="text-[11px] text-[var(--silver-0)]">{row.ruler}</div>
              <div className="text-[9px] text-[var(--silver-4)]">{row.kingdom}</div>
            </div>
            <span className="font-[var(--font-head)] text-[10px] text-[var(--silver-0)]">{row.prestige}</span>
            <span className="text-[9px] text-[var(--silver-3)]">{row.tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockShop() {
  const items = [
    { icon: "🏔️", name: "Volcanic Terrain",   cost: "3,200 Gold", tag: "TERRAIN",  limited: true  },
    { icon: "🌙", name: "Night Realm Skin",    cost: "4,800 Gold", tag: "SKIN",     limited: true  },
    { icon: "🔥", name: "Ember Keep Banner",   cost: "1,200 Gold", tag: "BANNER",   limited: false },
    { icon: "👑", name: "Conqueror Crown",     cost: "8,000 Gold", tag: "PRESTIGE", limited: true  },
    { icon: "🗺️", name: "Expanded Map View",  cost: "900 Gold",   tag: "UI",       limited: false },
    { icon: "✨", name: "Aura: Gold Shimmer",  cost: "2,400 Gold", tag: "EFFECT",   limited: false },
  ];
  return (
    <div className="tut-mock">
      <div className="tut-mock-bar">
        <span className="tut-mock-dot" style={{ background: "#c84040" }} />
        <span className="tut-mock-dot" style={{ background: "#c8a040" }} />
        <span className="tut-mock-dot" style={{ background: "#40c840" }} />
        <span className="tut-mock-url">Cosmetic Shop · Season I</span>
      </div>
      <div className="tut-mock-body p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[9px] uppercase tracking-widest text-[var(--steel-6)]">Available Items</div>
          <div className="flex items-center gap-1.5 text-[10px] font-[var(--font-head)] text-[var(--ember)]">
            ⚒️ <span>18,440 Gold available</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map(item => (
            <div key={item.name} className="border border-[var(--b1)] p-3 hover:border-[var(--ember)] transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{item.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[7px] border border-[var(--b1)] px-1 text-[var(--steel-6)] uppercase">{item.tag}</span>
                  {item.limited && <span className="text-[7px] border border-[var(--ember-lo)] px-1 text-[var(--ember-lo)] uppercase">Season Only</span>}
                </div>
              </div>
              <div className="text-[9px] text-[var(--silver-0)] leading-snug mb-1">{item.name}</div>
              <div className="text-[9px] text-[var(--ember)] font-[var(--font-head)]">{item.cost}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 border border-[var(--b0)] p-2 text-center text-[9px] text-[var(--silver-4)]">
          No real money required · Gold earned through commits only
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-[var(--steel-0)] text-[var(--silver-1)] font-[var(--font-body)]">

      {/* ── Page header ── */}
      <header className="border-b border-[var(--b1)] bg-[var(--abyss)] px-8 py-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-[var(--font-head)] text-sm text-[var(--silver-3)] hover:text-[var(--silver-1)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CommitCrown
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--steel-6)]">
            <span>Documentation</span>
            <span className="text-[var(--b1)]">·</span>
            <span className="text-[var(--ember)]">Ruler's Handbook</span>
          </div>
        </div>
      </header>

      {/* ── Hero strip ── */}
      <div className="relative border-b border-[var(--b1)] bg-[var(--abyss)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(200,88,26,0.08)_0%,transparent_65%)] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-8 py-16 relative">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-[var(--ember-lo)]" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--ember)] font-[var(--font-head)]">
              Complete Guide
            </span>
          </div>
          <h1 className="realm-display text-[clamp(2.4rem,6vw,4.8rem)] font-bold leading-[0.9] text-[var(--silver-0)] mb-5">
            The Ruler&apos;s<br />
            <span className="text-[var(--ember)]">Handbook</span>
          </h1>
          <p className="realm-lore max-w-lg text-[17px] leading-relaxed text-[var(--silver-2)]">
            Everything you need to know about CommitCrown — from signing in for
            the first time to conquering the global leaderboard. 13 steps,
            fully illustrated, with game-UI previews for every concept.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-[11px] uppercase tracking-widest text-[var(--silver-3)]">
            <span>13 steps</span>
            <span className="text-[var(--b1)]">·</span>
            <span>~12 min read</span>
            <span className="text-[var(--b1)]">·</span>
            <span>All skill levels</span>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="mx-auto max-w-6xl px-8 py-16 flex gap-16 items-start">

        {/* Left: sticky sidebar nav */}
        <TutorialNav />

        {/* Right: content */}
        <article className="flex-1 min-w-0 space-y-28">

          {/* ────────────────────────────────────────────────
              STEP 01 — Sign In With GitHub
              ──────────────────────────────────────────────── */}
          <section id="step-01" className="tut-step">
            <StepNumber n="01" />
            <h2 className="tut-h2">Sign In With GitHub</h2>
            <p className="tut-lead">
              CommitCrown has no password system. Your GitHub account is the key
              to your kingdom — click the sign-in button and you&apos;ll be
              redirected to GitHub&apos;s official OAuth authorization page in
              seconds.
            </p>
            <MockOAuth />
            <p className="tut-body">
              Once you click <strong>Authorize CommitCrown</strong>, GitHub issues
              a short-lived token and redirects you back. CommitCrown reads your
              public profile, your repository list, and your contribution graph.
              Nothing is written back to your GitHub account — ever.
            </p>
            <p className="tut-body">
              We request two scopes:{" "}
              <code className="tut-code">read:user</code> (so we can read your
              username, avatar, and bio) and{" "}
              <code className="tut-code">repo</code> (so we can list your public
              repositories). That is the full extent of the permissions.
            </p>
            <Tip>
              If you have a GitHub organization account and a personal account,
              sign in with the account where you push the most code — your kingdom
              is built from that account&apos;s contribution history.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 02 — Kingdom Creation
              ──────────────────────────────────────────────── */}
          <section id="step-02" className="tut-step">
            <StepNumber n="02" />
            <h2 className="tut-h2">Kingdom Creation</h2>
            <p className="tut-lead">
              The first time you sign in, CommitCrown analyses your entire GitHub
              contribution history — up to 90 days — to seed your starting
              kingdom with the right amount of resources, buildings, and prestige.
            </p>
            <MockKingdomCreation />
            <p className="tut-body">
              The analysis takes 10–30 seconds depending on how active your GitHub
              history is. During this time CommitCrown counts your commits, catalogues
              your repositories, detects programming languages, and calculates your
              longest streak.
            </p>
            <p className="tut-body">
              Once complete, your kingdom is assigned a permanent, public URL:{" "}
              <code className="tut-code">
                commitcrown.app/realm/your-github-username
              </code>
              . Share this URL with friends, add it to your GitHub README, or let
              rivals discover it on the world map.
            </p>
            <Note>
              Every resource and building in your starting kingdom reflects your
              real GitHub history. Developers with longer streak histories or more
              repositories will begin with a larger starting kingdom.
            </Note>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 03 — Dashboard Overview
              ──────────────────────────────────────────────── */}
          <section id="step-03" className="tut-step">
            <StepNumber n="03" />
            <h2 className="tut-h2">Dashboard Overview</h2>
            <p className="tut-lead">
              Your dashboard is the heart of CommitCrown — an isometric map of
              your kingdom surrounded by a HUD that displays all your live
              resources, army power, and quick-action buttons.
            </p>
            <MockDashboard />
            <p className="tut-body">
              The <strong>top bar</strong> shows your four primary resources (Gold,
              Wood, Stone, Food) and your total Army Power. Resources update every
              time GitHub sync runs. The <strong>bottom action bar</strong> lets
              you open the Build Menu, trigger a manual sync, launch a Raid,
              navigate the World Map, and visit the Shop.
            </p>
            <p className="tut-body">
              The isometric map shows every building you have placed, with each
              district corresponding to a cluster of repositories. Click any
              building to inspect its level, output stats, and upgrade options.
            </p>
            <Tip>
              Use the keyboard shortcut <code className="tut-code">B</code> to open
              the build menu, <code className="tut-code">R</code> to start a raid,
              and <code className="tut-code">W</code> to open the world map — all
              without reaching for your mouse.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 04 — Resources Explained
              ──────────────────────────────────────────────── */}
          <section id="step-04" className="tut-step">
            <StepNumber n="04" />
            <h2 className="tut-h2">Resources Explained</h2>
            <p className="tut-lead">
              CommitCrown has five resources, each derived directly from your
              GitHub activity. Nothing is purchased with real money — everything
              is earned through code.
            </p>
            <MockResources />
            <div className="tut-table-wrap">
              <table className="tut-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Source</th>
                    <th>Used For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>⚒️ Gold</td><td>Total commits</td><td>Buildings, upgrades, shop</td></tr>
                  <tr><td>🌲 Wood</td><td>Repository count</td><td>Defensive structures</td></tr>
                  <tr><td>🪨 Stone</td><td>Streak days</td><td>Walls, towers</td></tr>
                  <tr><td>🌾 Food</td><td>Lines of code</td><td>Army upkeep</td></tr>
                  <tr><td>✨ Prestige</td><td>All activity combined</td><td>Rank, leaderboard position</td></tr>
                </tbody>
              </table>
            </div>
            <p className="tut-body">
              Resources are recalculated every time your kingdom syncs with
              GitHub. Keep committing, keep building new repositories, and
              maintain your streak — all three actions grow your resources
              simultaneously.
            </p>
            <Warning>
              Prestige is your overall power score and the single metric used on
              the global leaderboard. It cannot be reset — only grown. The longer
              you play, the higher it climbs.
            </Warning>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 05 — Placing Buildings
              ──────────────────────────────────────────────── */}
          <section id="step-05" className="tut-step">
            <StepNumber n="05" />
            <h2 className="tut-h2">Placing Buildings</h2>
            <p className="tut-lead">
              Open the Build Menu (<code className="tut-code">B</code>) to see
              every building available at your current progression level. Each
              building costs a combination of resources and grants a permanent
              bonus to your kingdom.
            </p>
            <MockBuildMenu />
            <p className="tut-body">
              CommitCrown has six building types at launch, each serving a
              different strategic role:
            </p>
            <ul className="tut-list">
              <li><strong>⚔️ Barracks</strong> — converts your commit streak into raw Army Power. Essential for raids.</li>
              <li><strong>🏦 Treasury</strong> — generates passive Gold per hour based on your total repository count.</li>
              <li><strong>🌾 Granary</strong> — increases your Food storage cap so your army can grow larger.</li>
              <li><strong>🗼 Watch Tower</strong> — boosts defensive stats when your kingdom is under raid by a rival.</li>
              <li><strong>📚 Library</strong> — unlocks at 10 repositories. Provides a technology bonus to all building outputs.</li>
              <li><strong>🔭 Observatory</strong> — unlocks at level 5 Prestige. Generates passive Prestige per hour.</li>
            </ul>
            <Tip>
              Build a Barracks first. Without Army Power, you cannot initiate raids
              and your kingdom is more vulnerable to attack. Every other building is
              secondary until your Barracks is at least level 3.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 06 — Upgrading Buildings
              ──────────────────────────────────────────────── */}
          <section id="step-06" className="tut-step">
            <StepNumber n="06" />
            <h2 className="tut-h2">Upgrading Buildings</h2>
            <p className="tut-lead">
              Every building can be upgraded up to level 10. Each level multiplies
              the building&apos;s output by <strong>×1.2</strong>, compounding over
              time into significant power advantages.
            </p>
            <MockUpgrade />
            <p className="tut-body">
              To upgrade a building, click it on your isometric map (or select it
              from the building list on mobile) and press the Upgrade button. The
              cost increases at each level, so plan your upgrades strategically.
            </p>
            <div className="tut-table-wrap">
              <table className="tut-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Output multiplier</th>
                    <th>Approx. Gold cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1 → 2</td><td>×1.20</td><td>400 Gold</td></tr>
                  <tr><td>2 → 3</td><td>×1.44</td><td>640 Gold</td></tr>
                  <tr><td>3 → 4</td><td>×1.73</td><td>960 Gold</td></tr>
                  <tr><td>4 → 5</td><td>×2.07</td><td>1,200 Gold</td></tr>
                  <tr><td>9 → 10</td><td>×5.16</td><td>6,400 Gold</td></tr>
                </tbody>
              </table>
            </div>
            <Note>
              Prioritise upgrading buildings that feed your current goal. Going
              for the leaderboard? Max your Observatory first. Preparing for
              raids? Pour Gold into your Barracks.
            </Note>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 07 — Streaks & Army Power
              ──────────────────────────────────────────────── */}
          <section id="step-07" className="tut-step">
            <StepNumber n="07" />
            <h2 className="tut-h2">Streaks &amp; Army Power</h2>
            <p className="tut-lead">
              Your commit streak is the single most powerful variable in
              CommitCrown. The longer your unbroken streak, the stronger the unit
              type your Barracks trains — dramatically multiplying your Army Power.
            </p>
            <MockStreaks />
            <p className="tut-body">
              A <strong>streak</strong> is defined as making at least one commit on
              GitHub for consecutive calendar days. The streak counter resets at
              midnight UTC. As your streak grows, your Barracks automatically
              promotes the unit type it trains:
            </p>
            <div className="tut-table-wrap">
              <table className="tut-table">
                <thead>
                  <tr>
                    <th>Streak Length</th>
                    <th>Unit Type</th>
                    <th>Army Power Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1 – 7 days</td><td>🗡️ Infantry</td><td>Base</td></tr>
                  <tr><td>8 – 14 days</td><td>🐴 Cavalry</td><td>+35%</td></tr>
                  <tr><td>15 – 30 days</td><td>💣 Siege</td><td>+80%</td></tr>
                  <tr><td>31+ days</td><td>👑 Elite Guard</td><td>+150%</td></tr>
                </tbody>
              </table>
            </div>
            <Warning>
              If your streak breaks, your unit type drops back to Infantry
              immediately — even if your Barracks is at level 10. Protecting your
              streak is as important as building your kingdom.
            </Warning>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 08 — GitHub Sync
              ──────────────────────────────────────────────── */}
          <section id="step-08" className="tut-step">
            <StepNumber n="08" />
            <h2 className="tut-h2">GitHub Sync</h2>
            <p className="tut-lead">
              CommitCrown reads your GitHub data once a day at <strong>00:00 UTC</strong>{" "}
              automatically. All new commits, repositories, languages, and streak
              changes since the last sync are applied to your kingdom in a single
              atomic update.
            </p>
            <MockSync />
            <p className="tut-body">
              You can also trigger a <strong>manual sync</strong> from the dashboard
              at any time — but there is a one-hour cooldown between manual syncs
              to prevent abuse. The manual sync button shows the remaining cooldown
              time when it cannot be used.
            </p>
            <p className="tut-body">
              After each sync you will see a brief activity feed inside the Sync
              panel: how many commits were detected, whether your streak was
              extended, which repositories were updated, and how your resources
              changed. These events are also logged permanently in your Chronicle
              (see Step 04).
            </p>
            <Tip>
              Push commits to GitHub before midnight UTC to ensure they count
              toward your streak for that calendar day. Commits pushed after
              midnight count toward the <em>next</em> day&apos;s streak.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 09 — Explore Other Realms
              ──────────────────────────────────────────────── */}
          <section id="step-09" className="tut-step">
            <StepNumber n="09" />
            <h2 className="tut-h2">Explore Other Realms</h2>
            <p className="tut-lead">
              Press <code className="tut-code">W</code> or tap the World Map button
              to leave your own kingdom and explore the wider CommitCrown world.
              Every kingdom on the platform appears here, with real-time prestige
              and raid statistics.
            </p>
            <MockWorldMap />
            <p className="tut-body">
              The world map displays kingdoms as castle icons on a strategic grid.
              You can filter by prestige range, language, or raid activity to find
              suitable targets or allies. Clicking a kingdom opens its public
              profile — showing its building layout, resource totals, streak
              history, and raid record.
            </p>
            <p className="tut-body">
              Visiting another kingdom does not trigger any interaction — it is
              purely informational. Use it to scout before declaring a raid, find
              inspiration for your own build, or just admire the leaderboard elite.
            </p>
            <Note>
              Your own kingdom is public by default. Other players can visit and
              study your layout at any time. This is by design — strength is proven
              through commits, not secrecy.
            </Note>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 10 — Initiating a Raid
              ──────────────────────────────────────────────── */}
          <section id="step-10" className="tut-step">
            <StepNumber n="10" />
            <h2 className="tut-h2">Initiating a Raid</h2>
            <p className="tut-lead">
              When you are ready for PvP, open the Raid panel from a target
              kingdom&apos;s profile and challenge them to a 7-day war. The
              kingdom with the highest total raid points at the end of 7 days wins.
            </p>
            <MockRaidInit />
            <p className="tut-body">
              Before declaring war, you choose a <strong>strategy</strong> that
              modifies how your commits are scored during the raid:
            </p>
            <ul className="tut-list">
              <li><strong>Siege</strong> — rewards sustained, consistent committing. Every commit scores, with a +40% bonus to your base attack stat.</li>
              <li><strong>Skirmish</strong> — raw commit volume wins. No attack bonus, but quantity is weighted more heavily than commit quality.</li>
              <li><strong>Infiltration</strong> — targets your opponent&apos;s weakest resource. Effective against kingdoms with low Watch Tower levels.</li>
            </ul>
            <Warning>
              You can only have one active raid at a time. Once declared, a raid
              cannot be cancelled — it runs its full 7 days regardless of the
              outcome.
            </Warning>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 11 — During a Raid
              ──────────────────────────────────────────────── */}
          <section id="step-11" className="tut-step">
            <StepNumber n="11" />
            <h2 className="tut-h2">During a Raid</h2>
            <p className="tut-lead">
              A raid is decided by <strong>Raid Points</strong> accumulated over
              7 days. You earn raid points by committing to GitHub — your daily
              GitHub sync automatically converts those commits into raid points
              using the following formula:
            </p>
            <div className="tut-formula">
              Raid Points = Commits × (Army Power ÷ 1,000)
            </div>
            <MockRaidProgress />
            <p className="tut-body">
              Your Raid Panel updates every time your kingdom syncs. You can see
              the running totals for both sides, a day-by-day feed of activity,
              and a live status indicator showing who is currently winning.
            </p>
            <p className="tut-body">
              The raid ends automatically at 00:00 UTC on Day 8. The winner
              receives a <strong>+15% Prestige bonus</strong> added to their
              kingdom&apos;s total. The loser receives nothing — but loses no
              existing Prestige. Raids only reward; they never take away.
            </p>
            <Tip>
              The most effective raid strategy is simply to code as much as
              possible during the 7-day window. One commit per day is enough to
              stay competitive; daily commits from active developers are enough
              to dominate.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 12 — The Leaderboard
              ──────────────────────────────────────────────── */}
          <section id="step-12" className="tut-step">
            <StepNumber n="12" />
            <h2 className="tut-h2">The Leaderboard</h2>
            <p className="tut-lead">
              The global leaderboard ranks every kingdom by cumulative Prestige.
              There are four tiers, and the top rulers of each season are
              permanently inscribed in the Hall of Legend.
            </p>
            <MockLeaderboard />
            <div className="tut-table-wrap">
              <table className="tut-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Prestige Required</th>
                    <th>Reward</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>🪖 Recruit</td><td>0 – 24,999</td><td>Access to all features</td></tr>
                  <tr><td>🛡️ Knight</td><td>25,000 – 74,999</td><td>Exclusive Knight banner</td></tr>
                  <tr><td>🏆 Champion</td><td>75,000 – 124,999</td><td>Animated Champion aura + banner</td></tr>
                  <tr><td>⚜️ Legend</td><td>125,000+</td><td>Hall of Legend inscription + Legendary crown cosmetic</td></tr>
                </tbody>
              </table>
            </div>
            <p className="tut-body">
              Seasons run for three calendar months. At the end of each season,
              the top 10 Legend-tier rulers of that season are permanently
              displayed in the Hall of Legend — accessible from the landing page
              of CommitCrown for all time. Season rewards are cosmetic only;
              your Prestige total carries forward into the next season.
            </p>
            <Note>
              There is no pay-to-win shortcut to Legend tier. The only path is
              through sustained GitHub activity — which is exactly what makes the
              leaderboard meaningful.
            </Note>
          </section>

          {/* ────────────────────────────────────────────────
              STEP 13 — Shop & Cosmetics
              ──────────────────────────────────────────────── */}
          <section id="step-13" className="tut-step">
            <StepNumber n="13" />
            <h2 className="tut-h2">Shop &amp; Cosmetics</h2>
            <p className="tut-lead">
              The CommitCrown Shop sells cosmetic items that change the visual
              appearance of your kingdom. All items are purchased exclusively with
              <strong> Gold</strong> — the in-game resource earned from commits.
              No real money is involved, ever.
            </p>
            <MockShop />
            <p className="tut-body">
              The shop has five categories:
            </p>
            <ul className="tut-list">
              <li><strong>Terrain</strong> — changes the ground texture of your isometric map (volcanic, arctic, desert, etc.).</li>
              <li><strong>Skins</strong> — full visual reskins for your kingdom (night realm, ember realm, ocean realm).</li>
              <li><strong>Banners</strong> — decorative flags placed in your kingdom and displayed on the world map.</li>
              <li><strong>Effects</strong> — ambient particle effects around your castle (gold shimmer, ember aura, frost mist).</li>
              <li><strong>Prestige items</strong> — special cosmetics unlocked only by reaching Champion or Legend tier.</li>
            </ul>
            <p className="tut-body">
              Some items are <strong>season-limited</strong> — available only
              during a specific season and never returning to the shop. If you see
              something you want and have the Gold, buy it during its season window.
            </p>
            <Tip>
              Season-limited items are announced at the start of each season.
              Watch the CommitCrown changelog (linked in the footer) to stay
              informed about what&apos;s coming.
            </Tip>
          </section>

          {/* ────────────────────────────────────────────────
              VIDEO WALKTHROUGH
              ──────────────────────────────────────────────── */}
          <section id="video" className="tut-step">
            <div className="tut-step-num" style={{ background: "rgba(200,88,26,0.08)", borderColor: "var(--ember-lo)" }}>
              ▶
            </div>
            <h2 className="tut-h2">Video Walkthrough</h2>
            <p className="tut-lead">
              Prefer to watch rather than read? The full CommitCrown gameplay
              walkthrough covers all 13 steps with live in-game footage — kingdom
              creation, building placement, raiding, and the leaderboard.
            </p>

            {/* 16:9 video placeholder */}
            <div className="relative w-full aspect-video bg-[var(--steel-1)] border border-[var(--b1)] overflow-hidden group">
              {/* Background texture */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(200,88,26,0.06)_0%,transparent_70%)]" />
              <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle, rgba(100,130,160,0.05) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }} />
              {/* Placeholder content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 border-2 border-[var(--ember)] flex items-center justify-center group-hover:bg-[var(--ember)] transition-colors">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--ember)] group-hover:text-white ml-1 transition-colors">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <div className="font-[var(--font-head)] text-[var(--silver-0)] text-lg tracking-wide">
                    Full Gameplay Walkthrough
                  </div>
                  <div className="text-[var(--silver-3)] text-sm">
                    CommitCrown · Official Tutorial · ~15 min
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ember)] mt-3 border border-[var(--ember-lo)] px-4 py-2 inline-block">
                    Video Coming Soon
                  </div>
                </div>
              </div>
              {/* Corner labels */}
              <div className="absolute top-3 left-3 text-[9px] uppercase tracking-widest text-[var(--steel-6)]">
                16 : 9
              </div>
              <div className="absolute bottom-3 right-3 text-[9px] uppercase tracking-widest text-[var(--steel-6)]">
                Upload your video here
              </div>
            </div>

            <Note>
              To embed your video, replace the placeholder above with a standard
              YouTube or Vimeo <code className="tut-code">&lt;iframe&gt;</code>{" "}
              embed. The container is a fixed 16:9 aspect ratio and will scale
              responsively at any viewport width.
            </Note>
          </section>

          {/* ────────────────────────────────────────────────
              FOOTER CTA
              ──────────────────────────────────────────────── */}
          <div className="border-t border-[var(--b1)] pt-16 text-center space-y-6">
            <div className="font-[var(--font-head)] text-[10px] uppercase tracking-[0.28em] text-[var(--steel-6)]">
              You are ready.
            </div>
            <h2 className="realm-page-title text-[clamp(1.8rem,4vw,3rem)] font-bold text-[var(--silver-0)]">
              Claim Your Kingdom
            </h2>
            <p className="realm-lore mx-auto max-w-md text-[15px] leading-relaxed text-[var(--silver-2)]">
              Your GitHub history is already a fortress waiting to rise. Sign in
              and let CommitCrown forge it into legend.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <GitHubSignInButton initialError={null} />
              <Link
                href="/"
                className="realm-button realm-button-secondary border border-[var(--b1)] px-10 py-4 text-sm">
                Back to Home
              </Link>
            </div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--silver-4)]">
              Free forever · No credit card · Only commits
            </p>
          </div>

        </article>
      </div>
    </div>
  );
}
