import { NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('raids_enabled')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const newValue = !profile?.raids_enabled

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ raids_enabled: newValue })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ raids_enabled: newValue })
}
