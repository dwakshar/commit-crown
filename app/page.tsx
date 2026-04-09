import { redirect } from 'next/navigation'
import Link from 'next/link'

import { GitHubSignInButton } from '@/src/components/auth/GitHubSignInButton'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/kingdom')
  }

  const { count: kingdomCount } = await supabase
    .from('kingdoms')
    .select('id', { count: 'exact', head: true })

  const stars = Array.from({ length: 120 }, (_, index) => {
    const left = (index * 37) % 100
    const top = (index * 29) % 72
    const size = index % 9 === 0 ? 2 : index % 3 === 0 ? 1.5 : 1
    const opacity = 0.18 + (index % 7) * 0.07
    const duration = 2.6 + (index % 5) * 0.9
    const delay = (index % 11) * 0.35

    return { left, top, size, opacity, duration, delay }
  })

  const embers = Array.from({ length: 18 }, (_, index) => {
    const left = 32 + ((index * 7) % 36)
    const bottom = 28 + ((index * 5) % 18)
    const size = 1 + (index % 3)
    const duration = 8 + (index % 6) * 1.6
    const delay = (index % 8) * 0.75
    const drift = ((index % 7) - 3) * 12

    return { left, bottom, size, duration, delay, drift }
  })

  return (
    <main className="min-h-screen text-[var(--silver-1)]">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(20,30,50,0.7)_0%,transparent_65%),radial-gradient(ellipse_60%_50%_at_20%_60%,rgba(8,12,20,0.8)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_60%,rgba(8,12,20,0.8)_0%,transparent_60%),linear-gradient(180deg,#030408_0%,#06080f_18%,#0a0e18_45%,#070a12_75%,#040507_100%)]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {stars.map((star, index) => (
            <span
              key={`star-${index}`}
              className="absolute rounded-full bg-[var(--silver-0)]"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `star-twinkle ${star.duration}s ${star.delay}s ease-in-out infinite alternate`,
              }}
            />
          ))}
          <div className="absolute bottom-0 left-[-25%] right-[-25%] h-[48%] bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(90,115,145,0.06)_0%,transparent_70%)] animate-[mist-drift_16s_ease-in-out_infinite_alternate]" />
          <div className="absolute bottom-[8%] left-[-15%] right-[-15%] h-[30%] bg-[radial-gradient(ellipse_60%_100%_at_30%_100%,rgba(70,90,120,0.05)_0%,transparent_70%)] animate-[mist-drift_22s_ease-in-out_infinite_alternate-reverse]" />
          <div className="absolute bottom-[20%] left-0 right-0 h-[20%] bg-[radial-gradient(ellipse_40%_100%_at_65%_100%,rgba(60,80,110,0.04)_0%,transparent_70%)] animate-[mist-drift_30s_ease-in-out_infinite_alternate]" />
        </div>

        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 font-[var(--font-head)] text-sm uppercase tracking-[0.2em] text-[var(--silver-0)]">
            <span className="realm-orb h-10 w-10 rounded-full border border-[var(--b1)]" />
            CodeKingdom
          </div>
          <div className="hidden items-center gap-7 text-sm text-[var(--silver-2)] md:flex">
            <a href="#chronicle" className="transition hover:text-[var(--silver-0)]">Chronicle</a>
            <a href="#conquest" className="transition hover:text-[var(--silver-0)]">Conquest</a>
            <a href="#bazaar" className="transition hover:text-[var(--silver-0)]">Bazaar</a>
            <a href="#enlist" className="transition hover:text-[var(--silver-0)]">Enlist</a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl flex-col items-center justify-center px-4 pb-24 pt-8 text-center sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-x-0 bottom-[16%] mx-auto w-full max-w-[1200px]">
            <svg viewBox="0 0 1440 480" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full opacity-95">
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
              <polygon points="0,480 90,220 180,285 310,140 420,230 550,85 680,175 800,65 920,145 1050,100 1160,185 1290,140 1380,195 1440,170 1440,480" fill="url(#mtn1)" opacity="0.6" />
              <polygon points="0,480 150,280 300,330 450,220 590,300 730,195 870,265 1020,200 1180,255 1340,215 1440,240 1440,480" fill="url(#mtn2)" opacity="0.85" />
              <polygon points="0,480 200,350 420,390 620,320 820,375 1000,305 1200,360 1440,330 1440,480" fill="url(#mtn3)" />
              <rect x="590" y="370" width="260" height="20" fill="#040507" />
              <rect x="600" y="365" width="240" height="8" fill="#06080c" />
              <rect x="605" y="300" width="230" height="70" fill="#050709" />
              <rect x="590" y="255" width="56" height="115" fill="#060810" />
              <polygon points="590,240 646,240 634,205 602,205" fill="#04060a" />
              <rect x="794" y="255" width="56" height="115" fill="#060810" />
              <polygon points="794,240 850,240 848,205 796,205" fill="#04060a" />
              <rect x="660" y="210" width="120" height="160" fill="#07090f" />
              <polygon points="660,202 780,202 770,160 670,160" fill="#05070c" />
              <rect x="707" y="140" width="26" height="64" fill="#08090f" />
              <polygon points="705,133 735,133 720,88" fill="#06080e" />
              <rect x="698" y="326" width="44" height="44" fill="#030405" />
              <ellipse cx="720" cy="326" rx="22" ry="14" fill="#030405" />
              <rect x="682" y="235" width="10" height="13" fill="#c85a1a" opacity="0.20" rx="1" />
              <rect x="748" y="235" width="10" height="13" fill="#c85a1a" opacity="0.18" rx="1" />
              <rect x="715" y="235" width="10" height="13" fill="#c85a1a" opacity="0.22" rx="1" />
              <ellipse cx="720" cy="370" rx="80" ry="12" fill="#c85a1a" opacity="0.06" />
            </svg>

            {embers.map((ember, index) => (
              <span
                key={`ember-${index}`}
                className="absolute rounded-full"
                style={{
                  left: `${ember.left}%`,
                  bottom: `${ember.bottom}%`,
                  width: `${ember.size}px`,
                  height: `${ember.size}px`,
                  background: index % 2 === 0 ? '#c8581a' : '#e07030',
                  animation: `ember-rise ${ember.duration}s ${ember.delay}s ease-in infinite`,
                  ['--ember-drift' as string]: `${ember.drift}px`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-4xl">
            <div className="mx-auto mb-4 flex w-fit items-center gap-3 font-[var(--font-head)] text-[11px] uppercase tracking-[0.3em] text-[var(--plate-hi)]">
              <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,var(--steel-6))]" />
              Your Code. Your Kingdom.
              <span className="h-px w-8 bg-[linear-gradient(90deg,var(--steel-6),transparent)]" />
            </div>

            <h1 className="realm-display text-[clamp(3.8rem,11vw,7.6rem)] leading-[0.95]">
              Code<span className="text-[var(--ember)]">Kingdom</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-[clamp(1.05rem,2vw,1.35rem)] leading-8 text-[var(--silver-2)]">
              Every commit lays stone. Every repository raises a tower.
              <br />
              Your GitHub history builds a realm that breathes, battles, and endures.
            </p>

            <div id="enlist" className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="min-w-[260px]">
                <GitHubSignInButton />
              </div>
              <Link href="#chronicle" className="realm-button realm-button-secondary rounded-[18px] px-8 py-3">
                Witness the Realm
              </Link>
            </div>

            <p className="mt-4 text-sm text-[var(--silver-3)]">
              Continue with GitHub to claim your keep and enter the realm.
            </p>
          </div>

          <a href="#chronicle" className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.24em] text-[var(--silver-3)] transition hover:text-[var(--silver-1)]">
            <span>Scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      <section className="border-y border-[var(--b1)] bg-[linear-gradient(180deg,rgba(16,20,30,0.94),rgba(9,12,18,0.96))] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          {[
            { value: (kingdomCount ?? 0).toLocaleString(), label: 'Kingdoms Forged' },
            { value: '3.1M', label: 'Commits Chronicled' },
            { value: '214K', label: 'Raids Waged' },
            { value: '62', label: 'Languages of War' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-[var(--font-head)] text-3xl font-semibold text-[var(--silver-0)]">{stat.value}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.24em] text-[var(--silver-3)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="chronicle" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex w-fit items-center gap-3 font-[var(--font-head)] text-[11px] uppercase tracking-[0.3em] text-[var(--plate-hi)]">
              <span className="h-px w-8 bg-[linear-gradient(90deg,transparent,var(--steel-6))]" />
              The Pillars of the Realm
              <span className="h-px w-8 bg-[linear-gradient(90deg,var(--steel-6),transparent)]" />
            </div>
            <h2 className="realm-page-title text-[clamp(2.2rem,5vw,3.6rem)]">How the Kingdom is Forged</h2>
            <p className="realm-lore mx-auto mt-4 max-w-2xl text-base">
              &ldquo;From raw commits to castle spires. Your craft is the only currency that matters in this realm.&rdquo;
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['GitHub Forges Your Keep', 'Each commit adds stone. Each repository raises a new district. Every streak strengthens your walls against the siege of time.'],
              ['Wage War on Rivals', 'Challenge kingdoms with equivalent code output. The battle lasts seven days. Only consistent commits determine the victor.'],
              ['Build Without Limit', 'Forge towers, granaries, training grounds, and observatories. Each structure grants prestige bonuses and passive abilities.'],
              ['The Chronicle', 'An unbroken record of every language wielded and every milestone crossed. Your history cannot be erased, only extended.'],
              ['Explore Other Realms', 'Traverse the world map and visit allied kingdoms. Study their architecture. Challenge them. Forge pacts. Compete for dominance.'],
              ['Hall of Legend', 'The mightiest realms are inscribed in iron. Weekly conquest. Seasonal campaigns. Your name carved into the leaderboard.'],
            ].map(([title, description]) => (
              <article key={title} className="realm-panel rounded-[28px] p-6">
                <p className="realm-label text-[var(--ember-hi)]">Feature</p>
                <h3 className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">{title}</h3>
                <p className="mt-3 text-base leading-7 text-[var(--silver-2)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="conquest" className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="realm-panel rounded-[32px] p-8">
            <p className="realm-label text-[var(--plate-hi)]">Final Product Vision</p>
            <h2 className="realm-page-title mt-3 text-[clamp(2rem,4vw,3.2rem)]">A living GitHub strategy world</h2>
            <p className="realm-lore mt-4 text-base">
              The landing page now mirrors the attached concept language: steel, ember, mist, mountains, and a forged kingdom identity instead of a generic SaaS hero.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                <p className="realm-label">Kingdom Loop</p>
                <p className="mt-2 text-sm text-[var(--silver-2)]">Sync GitHub, grow the map, unlock structures, and sharpen your prestige.</p>
              </div>
              <div id="bazaar" className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                <p className="realm-label">Royal Bazaar</p>
                <p className="mt-2 text-sm text-[var(--silver-2)]">Themes, skins, banners, and progression cosmetics now sit inside the same world mood.</p>
              </div>
            </div>
          </div>

          <div className="realm-panel rounded-[32px] p-8">
            <p className="realm-label text-[var(--plate-hi)]">Join the Realm</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">Claim your keep</h2>
            <p className="mt-3 text-[var(--silver-2)]">
              Bring your GitHub account into CodeKingdom and see your real coding history become your territory.
            </p>
            <div className="mt-6">
              <GitHubSignInButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
