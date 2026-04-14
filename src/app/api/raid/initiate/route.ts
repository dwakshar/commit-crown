import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { calculateKingdomPower } from '@/src/lib/gameEngine'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createClient } from '@/utils/supabase/server'
import type { BuildingData, BuildingType } from '@/src/types/game'

const initiateRaidSchema = z.object({
  defenderId: z.string().uuid(),
})

type RaidTransactionRow = {
  raid_id: string
  attacker_gold: number
  defender_gold: number
  gold_stolen: number
  result: 'attacker_win' | 'defender_win'
}

type BuildingRow = {
  id: string
  type: BuildingType
  level: number
}

type DefenderProfileRow = {
  id: string
  username: string | null
  kingdoms:
    | {
        gold: number
        defense_rating: number
        buildings: BuildingRow[] | null
      }[]
    | null
}

type AttackerKingdomRow = {
  id: string
  gold: number
  attack_rating: number
  buildings: BuildingRow[] | null
}

function toBuildings(rows: BuildingRow[] | null | undefined): BuildingData[] {
  return (rows ?? []).map((b) => ({
    id: b.id,
    type: b.type,
    level: Math.min(5, Math.max(1, b.level)) as BuildingData['level'],
    x: 0,
    y: 0,
  }))
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

  // Fetch both kingdoms with buildings so we can compute true combat power.
  const [{ data: attackerKingdom }, { data: defenderProfile }] = await Promise.all([
    supabase
      .from('kingdoms')
      .select('id, gold, attack_rating, buildings(id, type, level)')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('id, username, kingdoms(gold, defense_rating, buildings(id, type, level))')
      .eq('id', defenderId)
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

  const attackerStats = attackerKingdom as AttackerKingdomRow

  // Include building bonuses in combat power (previously omitted — buildings had zero effect on raids).
  const attackerBuildings = toBuildings(attackerStats.buildings)
  const defenderBuildings = toBuildings(defenderKingdom.buildings)

  const attackerPowerFull = calculateKingdomPower(
    { attack_rating: attackerStats.attack_rating, defense_rating: 0 },
    attackerBuildings,
  ).attack

  const defenderPowerFull = calculateKingdomPower(
    { attack_rating: 0, defense_rating: defenderKingdom.defense_rating },
    defenderBuildings,
  ).defense

  // Apply ±15% variance so investment in buildings matters more than raw luck.
  // Range: base * 0.85 to base * 1.15
  const attackPower = Math.floor(attackerPowerFull * (0.85 + Math.random() * 0.3))
  const defensePower = Math.floor(defenderPowerFull * (0.85 + Math.random() * 0.3))

  const { data: transactionData, error: transactionError } = await supabaseAdmin.rpc(
    'execute_raid_transaction',
    {
      p_attacker_id: user.id,
      p_defender_id: defenderId,
      p_attacker_power: attackPower,
      p_defender_power: defensePower,
    },
  )

  if (transactionError) {
    if (transactionError.message.startsWith('Raid cooldown active until ')) {
      const availableAt = transactionError.message.replace('Raid cooldown active until ', '')

      return NextResponse.json(
        {
          error: 'cooldown',
          availableAt,
        },
        { status: 429 },
      )
    }

    if (transactionError.message === 'raids_disabled') {
      return NextResponse.json({ error: 'raids_disabled' }, { status: 403 })
    }

    return NextResponse.json(
      { error: transactionError.message || 'Raid failed' },
      { status: 500 },
    )
  }

  const transactionRow = (transactionData?.[0] as RaidTransactionRow | undefined) ?? null

  if (!transactionRow) {
    return NextResponse.json({ error: 'Raid failed' }, { status: 500 })
  }

  await checkAndAwardAchievements(user.id, supabaseAdmin)

  return NextResponse.json({
    success: true,
    raid: {
      id: transactionRow.raid_id,
      result: transactionRow.result,
      attackPower,
      defensePower,
      goldStolen: transactionRow.gold_stolen,
      attackerGold: transactionRow.attacker_gold,
      defenderGold: transactionRow.defender_gold,
      defenderName: defender.username ?? 'Unknown Defender',
    },
  })
}
