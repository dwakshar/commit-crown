'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase'

export function GitHubSignInButton({ initialError }: { initialError?: string | null } = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null)

  useEffect(() => {
    setErrorMessage(initialError ?? null)
  }, [initialError])

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
        className="realm-button realm-button-primary rounded-[18px] px-5 py-3 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {isLoading ? 'Connecting to GitHub...' : 'Sign In With GitHub'}
      </button>
      {errorMessage ? <p className="text-sm text-[#ff9b9b]">{errorMessage}</p> : null}
    </div>
  )
}
