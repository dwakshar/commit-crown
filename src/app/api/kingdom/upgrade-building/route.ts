import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createClient } from '@/utils/supabase/server'

const upgradeBuildingSchema = z.object({
  buildingId: z.uuid(),
})

type UpgradeRow = {
  building_id: string
  level: number
  gold: number
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
  const parsed = upgradeBuildingSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: building, error: buildingError } = await supabase
    .from('buildings')
    .select('id, level, kingdom:kingdoms!inner(id, user_id, gold)')
    .eq('id', parsed.data.buildingId)
    .eq('kingdoms.user_id', user.id)
    .single()

  if (buildingError || !building) {
    return NextResponse.json({ error: 'Building not found' }, { status: 404 })
  }

  const { data, error } = await supabase.rpc('upgrade_building_transaction', {
    p_building_id: parsed.data.buildingId,
    p_user_id: user.id,
  })

  if (error) {
    const message = error.message.includes('Insufficient gold')
      ? 'Insufficient gold'
      : error.message

    return NextResponse.json(
      { error: message },
      { status: message === 'Insufficient gold' ? 400 : 500 },
    )
  }

  const updated = (data?.[0] as UpgradeRow | undefined) ?? null

  if (!updated) {
    return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 })
  }

  await checkAndAwardAchievements(user.id, supabaseAdmin)

  return NextResponse.json({
    success: true,
    building: {
      id: updated.building_id,
      level: updated.level,
    },
    gold: updated.gold,
  })
}
