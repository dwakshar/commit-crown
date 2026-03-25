import { NextResponse } from 'next/server'
import { z } from 'zod'

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

  const [{ data: host }, { data: visitorProfile }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', parsed.data.defenderId).maybeSingle(),
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle(),
  ])

  if (!host) {
    return NextResponse.json({ error: 'Kingdom host not found' }, { status: 404 })
  }

  const visitedAt = new Date().toISOString()

  const [{ error: visitError }, { error: notificationError }] = await Promise.all([
    supabase.from('visits').insert({
      visitor_id: user.id,
      host_id: parsed.data.defenderId,
      visited_at: visitedAt,
    }),
    supabase.from('notifications').insert({
      user_id: parsed.data.defenderId,
      type: 'kingdom_visited',
      message: `${visitorProfile?.username ?? 'A scout'} left a flag at your kingdom.`,
      data: {
        visitor_id: user.id,
        visited_at: visitedAt,
      },
    }),
  ])

  if (visitError || notificationError) {
    return NextResponse.json(
      { error: visitError?.message ?? notificationError?.message ?? 'Unable to record visit' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
