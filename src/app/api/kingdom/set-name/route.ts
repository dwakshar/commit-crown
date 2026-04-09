import { NextResponse } from 'next/server'
import { z } from 'zod'

import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createClient } from '@/utils/supabase/server'

const setNameSchema = z.object({
  name: z.string().trim().min(2).max(30),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = setNameSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const kingdomName = parsed.data.name

  const [{ error: kingdomError }, { error: profileError }] = await Promise.all([
    supabaseAdmin.from('kingdoms').upsert(
      {
        user_id: user.id,
        name: kingdomName,
        gold: 0,
        prestige: 0,
        population: 0,
        defense_rating: 0,
        attack_rating: 0,
        building_slots: 5,
      },
      {
        onConflict: 'user_id',
      },
    ),
    supabaseAdmin
      .from('profiles')
      .update({
        kingdom_name_set: true,
      })
      .eq('id', user.id),
  ])

  if (kingdomError || profileError) {
    return NextResponse.json(
      { error: kingdomError?.message ?? profileError?.message ?? 'Unable to set kingdom name' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    name: kingdomName,
  })
}
