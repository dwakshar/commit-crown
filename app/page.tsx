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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.18),transparent_35%),linear-gradient(180deg,#120f1d_0%,#09070e_100%)] px-4 py-12 text-[#f7f1e4]">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center gap-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.32em] text-[#C9A84C]/75">CodeKingdom</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight">
            Build your kingdom from your GitHub legacy.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
            Sync your GitHub profile, grow an isometric strategy kingdom, unlock achievements,
            raid rivals, and climb the leaderboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/65">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">GitHub Sync</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Raids</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Achievements</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Realtime Realm Alerts</span>
          </div>
        </div>

        <section className="w-full max-w-md rounded-[32px] border border-[#C9A84C]/25 bg-[linear-gradient(180deg,rgba(20,15,30,0.96),rgba(10,7,16,0.95))] p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Enter the Realm</p>
          <h2 className="mt-3 text-3xl font-semibold">Start with GitHub</h2>
          <p className="mt-4 text-sm leading-7 text-white/72">
            Sign in with GitHub to mint your profile, sync your coding stats, and generate your first kingdom.
          </p>
          <div className="mt-8">
            <GitHubSignInButton />
          </div>
        </section>
      </div>
    </main>
  )
}
