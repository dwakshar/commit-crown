import { NextResponse } from 'next/server'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const unlocked = await checkAndAwardAchievements(user.id, supabase)

    return NextResponse.json({
      success: true,
      achievements: unlocked,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to check achievements' },
      { status: 500 },
    )
  }
}
