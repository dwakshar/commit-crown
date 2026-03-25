import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createClient } from '@/utils/supabase/server'

const initiateRaidSchema = z.object({
  defenderId: z.uuid(),
})

type RaidTransactionRow = {
  raid_id: string
  attacker_gold: number
  defender_gold: number
  gold_stolen: number
  result: 'attacker_win' | 'defender_win'
}

type DefenderProfileRow = {
  id: string
  username: string | null
  raids_enabled: boolean | null
  kingdoms:
    | {
        gold: number
        defense_rating: number
      }[]
    | null
}

type AttackerKingdomRow = {
  id: string
  gold: number
  attack_rating: number
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = initiateRaidSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { defenderId } = parsed.data

  if (defenderId === user.id) {
    return NextResponse.json({ error: 'Cannot raid yourself' }, { status: 400 })
  }

  const [{ data: attackerKingdom }, { data: defenderProfile }, { data: cooldown }] = await Promise.all([
    supabase
      .from('kingdoms')
      .select('id, gold, attack_rating')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, username, raids_enabled, kingdoms(gold, defense_rating)')
      .eq('id', defenderId)
      .maybeSingle(),
    supabase
      .from('raid_cooldowns')
      .select('last_raid_at')
      .eq('attacker_id', user.id)
      .eq('defender_id', defenderId)
      .maybeSingle(),
  ])

  if (!attackerKingdom) {
    return NextResponse.json({ error: 'Attacker kingdom not found' }, { status: 404 })
  }

  const defender = defenderProfile as DefenderProfileRow | null
  const defenderKingdom = defender?.kingdoms?.[0]

  if (!defender || !defenderKingdom) {
    return NextResponse.json({ error: 'Defender kingdom not found' }, { status: 404 })
  }

  if (!defender.raids_enabled) {
    return NextResponse.json({ error: 'raids_disabled' }, { status: 403 })
  }

  if (cooldown?.last_raid_at) {
    const cooldownEndsAt = new Date(cooldown.last_raid_at)
    cooldownEndsAt.setHours(cooldownEndsAt.getHours() + 24)

    if (cooldownEndsAt.getTime() > Date.now()) {
      return NextResponse.json(
        {
          error: 'cooldown',
          availableAt: cooldownEndsAt.toISOString(),
        },
        { status: 429 },
      )
    }
  }

  const attackerStats = attackerKingdom as AttackerKingdomRow
  const attackerVariance = Math.random() * (attackerStats.attack_rating * 0.3)
  const defenderVariance = Math.random() * (defenderKingdom.defense_rating * 0.3)
  const attackPower = Math.floor(attackerStats.attack_rating + attackerVariance)
  const defensePower = Math.floor(defenderKingdom.defense_rating + defenderVariance)
  const result: 'attacker_win' | 'defender_win' =
    attackPower > defensePower ? 'attacker_win' : 'defender_win'
  const goldStolen =
    result === 'attacker_win' ? Math.floor(defenderKingdom.gold * 0.1) : 0

  const { data: transactionData, error: transactionError } = await supabase.rpc(
    'execute_raid_transaction',
    {
      p_attacker_id: user.id,
      p_defender_id: defenderId,
      p_attacker_power: attackPower,
      p_defender_power: defensePower,
      p_result: result,
      p_gold_stolen: goldStolen,
    },
  )

  if (transactionError) {
    return NextResponse.json(
      { error: transactionError.message || 'Raid failed' },
      { status: 500 },
    )
  }

  const transactionRow = (transactionData?.[0] as RaidTransactionRow | undefined) ?? null

  if (!transactionRow) {
    return NextResponse.json({ error: 'Raid failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    raid: {
      id: transactionRow.raid_id,
      result: transactionRow.result,
      attackPower,
      defensePower,
      goldStolen: Math.min(goldStolen, Math.floor(defenderKingdom.gold * 0.1)),
      attackerGold: transactionRow.attacker_gold,
      defenderGold: transactionRow.defender_gold,
      defenderName: defender.username ?? 'Unknown Defender',
    },
  })
}
