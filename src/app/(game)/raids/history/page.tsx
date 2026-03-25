import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

type RaidRow = {
  id: string
  attacker_id: string
  defender_id: string
  attacker_power: number
  defender_power: number
  result: 'attacker_win' | 'defender_win'
  gold_stolen: number
  created_at: string
}

export default async function RaidHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: raids } = await supabase
    .from('raids')
    .select('id, attacker_id, defender_id, attacker_power, defender_power, result, gold_stolen, created_at')
    .or(`attacker_id.eq.${user.id},defender_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#120f1d_0%,#09070e_100%)] px-4 py-10 text-[#f7f1e4]">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">War Archive</p>
            <h1 className="mt-3 text-3xl font-semibold">Raid History</h1>
          </div>
          <Link href="/kingdom" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
            Return to Kingdom
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          {((raids as RaidRow[] | null) ?? []).map((raid) => (
            <div key={raid.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-white/65">{new Date(raid.created_at).toLocaleString()}</span>
                <span className="rounded-full border border-[#C9A84C]/25 bg-[#1a1524] px-3 py-1 text-sm text-[#C9A84C]">
                  {raid.result === 'attacker_win' ? 'Attacker Victory' : 'Defender Victory'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-6 text-sm text-white/75">
                <span>Attack Power: {raid.attacker_power}</span>
                <span>Defense Power: {raid.defender_power}</span>
                <span>Gold Stolen: {raid.gold_stolen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
