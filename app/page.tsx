import { redirect } from 'next/navigation'

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_35%),linear-gradient(180deg,#120f1d_0%,#09070e_100%)] px-4 py-12 text-[#f7f1e4]">
      <div className="mx-auto max-w-6xl">
        <section className="grid min-h-[78vh] gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-[#C9A84C]/75">CodeKingdom</p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Your GitHub history is a kingdom waiting to be built
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Turn real repository activity into a living strategy realm with buildings, prestige,
              raids, and progression shaped by the work you already ship.
            </p>

            <div className="mt-8 rounded-2xl border border-[#C9A84C]/20 bg-[#18111f]/75 px-5 py-4 text-sm text-[#f0ddb0]">
              Join {(kingdomCount ?? 0).toLocaleString()} developers already playing
            </div>

            <div className="mt-8 max-w-sm">
              <GitHubSignInButton />
              <p className="mt-3 text-sm text-white/52">Start for free - Continue with GitHub</p>
            </div>
          </div>

          <section className="rounded-[36px] border border-[#C9A84C]/20 bg-[linear-gradient(180deg,rgba(22,17,29,0.96),rgba(9,7,14,0.96))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="grid gap-4">
              <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs uppercase tracking-[0.26em] text-[#C9A84C]/70">Real data</p>
                <h2 className="mt-3 text-2xl font-semibold">Every stat comes from your GitHub footprint</h2>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Repositories, stars, followers, streaks, and language mix all shape the kingdom you unlock.
                </p>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs uppercase tracking-[0.26em] text-[#C9A84C]/70">Active gameplay</p>
                <h2 className="mt-3 text-2xl font-semibold">Code more, build more, climb higher</h2>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Upgrade buildings, expand your realm, unlock achievements, and keep syncing to grow your power.
                </p>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs uppercase tracking-[0.26em] text-[#C9A84C]/70">Multiplayer</p>
                <h2 className="mt-3 text-2xl font-semibold">Scout rival kingdoms and raid the leaderboard</h2>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  Visit other developers, compare realms, and compete in a shared GitHub-powered world.
                </p>
              </article>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
