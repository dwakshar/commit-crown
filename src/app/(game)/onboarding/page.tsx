import { redirect } from 'next/navigation'

import { OnboardingClient } from '@/src/app/(game)/onboarding/OnboardingClient'
import { getOnboardingInitialName } from '@/src/lib/onboarding'
import { createClient } from '@/utils/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, onboarding_done, kingdoms(name)')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (profile?.onboarding_done) {
    redirect('/kingdom')
  }

  const currentKingdomName =
    Array.isArray(profile?.kingdoms) && profile.kingdoms.length > 0
      ? (profile.kingdoms[0] as { name: string | null }).name
      : null

  return (
    <OnboardingClient
      initialName={getOnboardingInitialName(profile?.username ?? null, currentKingdomName)}
    />
  )
}
