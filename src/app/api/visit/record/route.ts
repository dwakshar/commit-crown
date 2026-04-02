import { NextResponse } from 'next/server'
import { z } from 'zod'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createClient } from '@/utils/supabase/server'

const visitRecordSchema = z.object({
  defenderId: z.uuid(),
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
  const parsed = visitRecordSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  if (parsed.data.defenderId === user.id) {
    return NextResponse.json({ error: 'Cannot visit your own kingdom' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.rpc('record_kingdom_visit', {
    p_visitor_id: user.id,
    p_host_id: parsed.data.defenderId,
  })

  if (error) {
    const status = error.message === 'Kingdom host not found' ? 404 : 500

    return NextResponse.json(
      { error: error.message ?? 'Unable to record visit' },
      { status },
    )
  }

  const visitResult = (data?.[0] as { recorded: boolean; visited_at: string } | undefined) ?? null

  if (!visitResult) {
    return NextResponse.json({ error: 'Unable to record visit' }, { status: 500 })
  }

  if (visitResult.recorded) {
    await checkAndAwardAchievements(user.id, supabaseAdmin)
  }

  return NextResponse.json({ success: true, recorded: visitResult.recorded, visitedAt: visitResult.visited_at })
}
