'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase'

export function GitHubSignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user repo',
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in with GitHub')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#22190b] transition hover:bg-[#d7b864] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
      >
        {isLoading ? 'Connecting to GitHub...' : 'Sign In With GitHub'}
      </button>
      {errorMessage ? <p className="text-sm text-[#ff9b9b]">{errorMessage}</p> : null}
    </div>
  )
}
