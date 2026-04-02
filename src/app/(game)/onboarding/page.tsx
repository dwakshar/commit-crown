import { redirect } from 'next/navigation'

import { OnboardingClient } from '@/src/app/(game)/onboarding/OnboardingClient'
import { getOnboardingInitialName } from '@/src/lib/onboarding'
import { createClient } from '@/utils/supabase/server'

type ProfileRow = {
  username: string | null
  onboarding_done: boolean | null
}

type KingdomRow = {
  name: string | null
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [{ data: profile, error: profileError }, { data: kingdom, error: kingdomError }] = await Promise.all([
    supabase.from('profiles').select('username, onboarding_done').eq('id', user.id).maybeSingle(),
    supabase.from('kingdoms').select('name').eq('user_id', user.id).maybeSingle(),
  ])

  if (profileError || kingdomError) {
    console.error('Unable to load onboarding state', {
      userId: user.id,
      profileError: profileError?.message,
      kingdomError: kingdomError?.message,
    })
  }

  const typedProfile = (profile as ProfileRow | null) ?? null
  const typedKingdom = (kingdom as KingdomRow | null) ?? null

  if (typedProfile?.onboarding_done) {
    redirect('/kingdom')
  }

  return (
    <OnboardingClient
      initialName={getOnboardingInitialName(typedProfile?.username ?? null, typedKingdom?.name ?? null)}
    />
  )
}
