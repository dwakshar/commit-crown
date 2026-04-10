import Link from "next/link";
import { redirect } from "next/navigation";

import { GitHubSignInButton } from "@/src/components/auth/GitHubSignInButton";
import { createClient } from "@/utils/supabase/server";

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
    <main className="min-h-screen overflow-hidden text-[var(--silver-1)] font-[var(--font-body)]">
      <section className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(20,30,50,0.75)_0%,transparent_65%),radial-gradient(ellipse_60%_50%_at_20%_60%,rgba(8,12,20,0.85)_0%,transparent_60%),radial-gradient(ellipse_60%_50%_at_80%_60%,rgba(8,12,20,0.85)_0%,transparent_60%),linear-gradient(180deg,#030408_0%,#06080f_18%,#0a0e18_45%,#070a12_75%,#040507_100%)]" />

        <div className="absolute inset-0 pointer-events-none" id="stars" />

        <div className="absolute bottom-0 left-[-25%] right-[-25%] h-[48%] bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(90,115,145,0.06)_0%,transparent_70%)] animate-[mist-drift_16s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[8%] left-[-15%] right-[-15%] h-[30%] bg-[radial-gradient(ellipse_60%_100%_at_30%_100%,rgba(70,90,120,0.05)_0%,transparent_70%)] animate-[mist-drift_22s_ease-in-out_infinite_alternate-reverse]" />
        <div className="absolute bottom-[20%] left-0 right-0 h-[20%] bg-[radial-gradient(ellipse_40%_100%_at_65%_100%,rgba(60,80,110,0.04)_0%,transparent_70%)] animate-[mist-drift_30s_ease-in-out_infinite_alternate]" />

        <div className="absolute bottom-0 left-0 right-0 h-[62%] pointer-events-none">
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
              fill="url(#mtn1)"
              opacity="0.6"
            />
            <polygon
              points="0,480 150,280 300,330 450,220 590,300 730,195 870,265 1020,200 1180,255 1340,215 1440,240 1440,480"
              fill="url(#mtn2)"
              opacity="0.85"
            />
            <polygon
              points="0,480 200,350 420,390 620,320 820,375 1000,305 1200,360 1440,330 1440,480"
              fill="url(#mtn3)"
            />
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
            <rect
              x="682"
              y="235"
              width="10"
              height="13"
              fill="#c85a1a"
              opacity="0.20"
              rx="1"
            />
            <rect
              x="748"
              y="235"
              width="10"
              height="13"
              fill="#c85a1a"
              opacity="0.18"
              rx="1"
            />
            <rect
              x="715"
              y="235"
              width="10"
              height="13"
              fill="#c85a1a"
              opacity="0.22"
              rx="1"
            />
            <ellipse
              cx="720"
              cy="370"
              rx="80"
              ry="12"
              fill="#c85a1a"
              opacity="0.06"
            />
          </svg>
        </div>

        <div className="absolute inset-0 pointer-events-none" id="embers" />

        <nav className="relative z-20 flex items-center justify-between px-8 py-8">
          <div className="flex items-center gap-3 font-[var(--font-head)] text-lg tracking-[0.03em] text-[var(--silver-0)]">
            <div className="realm-orb h-9 w-9 rounded-full border border-[var(--b1)] bg-[radial-gradient(circle_at_35%_35%,var(--plate-hi)_0%,var(--steel-5)_58%,var(--steel-3)_100%)]" />
            CodeKingdom
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex items-center gap-4 text-[12px] uppercase tracking-[0.4em] text-[var(--plate-hi)]">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--steel-6)]" />
            Your Code. Your Kingdom.
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--steel-6)]" />
          </div>

          <h1 className="realm-display text-[clamp(52px,9vw,96px)] font-bold leading-[0.96] tracking-[-0.02em] text-[var(--silver-0)]">
            Commit<span className="text-[var(--ember)]">Crown</span>
          </h1>

          <p className="realm-lore mt-6 max-w-2xl text-[clamp(17px,2.2vw,21px)] leading-4 text-[var(--silver-2)]">
            Every commit lays stone. Every repository raises a tower. Your
            GitHub history builds a realm that breathes, battles, and endures.
          </p>

          <div id="enlist" className="mt-12 flex flex-col sm:flex-row gap-4">
            <GitHubSignInButton initialError={authErrorMessage} />
            <Link
              href="#chronicle"
              className="realm-button realm-button-secondary px-10 py-4 text-sm">
              Witness the Realm
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--silver-3)]">
            Continue with GitHub to claim your keep
          </p>
        </div>

        <a
          href="#chronicle"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[var(--silver-4)] hover:text-[var(--silver-2)] transition">
          SCROLL
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 5L8 11L13 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </section>

      <div className="border-y border-[var(--b1)] bg-[linear-gradient(180deg,var(--steel-1)_0%,var(--steel-2)_100%)] py-14">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {
              value: (kingdomCount ?? 0).toLocaleString(),
              label: "Kingdoms Forged",
            },
            { value: "120", label: "Commits Chronicled" },
            { value: "18", label: "Raids Waged" },
            { value: "62", label: "Languages of War" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-[var(--font-head)] text-4xl text-[var(--silver-0)]">
                {stat.value}
              </div>
              <div className="mt-2 text-xs tracking-[0.22em] uppercase text-[var(--silver-3)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section
        id="chronicle"
        className="px-6 py-24 bg-[var(--steel-0)] border-t border-[var(--b1)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-6 text-[var(--silver-3)] text-xs uppercase tracking-[0.25em]">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-[var(--b2)] to-transparent" />
              THE PILLARS OF THE REALM
              <div className="h-px w-12 bg-gradient-to-l from-transparent via-[var(--b2)] to-transparent" />
            </div>

            <h2 className="realm-page-title mt-4 text-[clamp(2.4rem,5.5vw,3.8rem)] font-bold leading-none tracking-tight text-[var(--silver-0)]">
              How The Kingdom Is Forged
            </h2>

            <p className="realm-lore mx-auto mt-6 max-w-2xl text-lg leading-4 text-[var(--silver-2)]">
              From raw commits to castle spires — your craft is the only
              currency that matters in this realm.
            </p>
          </div>

          <div className="features-grid fade-group grid md:grid-cols-2 xl:grid-cols-3 gap-px bg-[var(--b0)] p-px overflow-hidden">
            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">⚒️</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                GitHub Forges Your Keep
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                Each commit adds stone. Each repository raises a new district.
                Every streak strengthens your walls against the siege of time.
              </p>
            </div>

            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">⚔️</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                Wage War on Rivals
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                Challenge kingdoms with equivalent code output. The battle lasts
                seven days. Only consistent commits determine the victor.
              </p>
            </div>

            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">🏰</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                Build Without Limit
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                Forge towers, granaries, training grounds, and observatories.
                Each structure grants prestige bonuses and passive abilities.
              </p>
            </div>

            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">📜</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                The Chronicle
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                An unbroken record of every language wielded, every milestone
                crossed. Your history cannot be erased — only extended.
              </p>
            </div>

            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">🌍</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                Explore Other Realms
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                Traverse the world map and visit allied kingdoms. Study their
                architecture. Challenge them. Forge pacts. Compete for
                dominance.
              </p>
            </div>

            <div className="feature-card bg-[var(--steel-2)] p-10">
              <span className="feat-icon text-4xl mb-6 block">🏆</span>
              <div className="feat-title text-xl font-semibold text-[var(--silver-0)] mb-4">
                Hall of Legend
              </div>
              <p className="feat-desc text-[var(--silver-2)] leading-relaxed">
                The mightiest realms inscribed in the Hall of Legend. Weekly
                conquest. Seasonal campaigns. Your name carved in iron.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
