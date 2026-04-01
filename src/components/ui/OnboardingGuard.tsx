import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!profile?.onboarding_done) {
    redirect('/onboarding')
  }

  return <>{children}</>
}
