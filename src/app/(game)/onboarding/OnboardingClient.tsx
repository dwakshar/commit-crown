'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { countGeneratedBuildings, getTopLanguageBuildingUnlocked } from '@/src/lib/onboarding'

import type { KingdomData } from '@/src/types/game'

type Step = 1 | 2 | 3

type SyncResponse = {
  success?: boolean
  code?: string
  error?: string
  stats?: Partial<KingdomData>
  githubStats?: KingdomData['githubStats']
}

type KingdomResponse = {
  success?: boolean
  kingdom?: KingdomData
  error?: string
}

async function parseJsonResponse<T extends { error?: string }>(response: Response): Promise<T> {
  const raw = await response.text()

  if (!raw.trim()) {
    return {} as T
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return {
      error: raw,
    } as T
  }
}

const SYNC_STAGES = [
  'Counting your commits...',
  'Mapping your repositories...',
  'Building your kingdom...',
] as const

export function OnboardingClient({
  initialName,
}: {
  initialName: string
}) {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState(initialName)
  const [syncIndex, setSyncIndex] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSubmittingName, setIsSubmittingName] = useState(false)
  const [summary, setSummary] = useState<KingdomData | null>(null)
  const hasStartedSyncRef = useRef(false)
  const router = useRouter()

  const trimmedName = name.trim().slice(0, 30)

  const topLanguageBuilding = useMemo(() => {
    return summary ? getTopLanguageBuildingUnlocked(summary.githubStats) : 'Town Hall'
  }, [summary])

  const totalBuildings = useMemo(() => {
    return summary ? countGeneratedBuildings(summary.buildings) : 0
  }, [summary])

  useEffect(() => {
    if (step !== 2 || hasStartedSyncRef.current) {
      return
    }

    hasStartedSyncRef.current = true
    setSyncError(null)

    const stageTimer = window.setInterval(() => {
      setSyncIndex((current) => (current < SYNC_STAGES.length - 1 ? current + 1 : current))
    }, 1100)

    const runSync = async () => {
      try {
        const syncResponse = await fetch('/api/github/sync', {
          method: 'POST',
        })

        const syncPayload = await parseJsonResponse<SyncResponse>(syncResponse)

        if (!syncResponse.ok) {
          throw new Error(syncPayload.error ?? 'Unable to forge your kingdom')
        }

        const kingdomResponse = await fetch('/api/kingdom', {
          method: 'GET',
          cache: 'no-store',
        })

        const kingdomPayload = await parseJsonResponse<KingdomResponse>(kingdomResponse)

        if (!kingdomResponse.ok || !kingdomPayload.kingdom) {
          if (syncPayload.success) {
            setSummary({
              id: 'pending-kingdom',
              userId: 'pending-user',
              name: trimmedName || 'My Kingdom',
              gold: 0,
              prestige: syncPayload.stats?.prestige ?? 0,
              population: syncPayload.stats?.population ?? 0,
              defense_rating: syncPayload.stats?.defense_rating ?? 0,
              attack_rating: syncPayload.stats?.attack_rating ?? 0,
              building_slots: syncPayload.stats?.building_slots ?? 5,
              last_synced_at:
                typeof syncPayload.stats?.last_synced_at === 'string'
                  ? syncPayload.stats.last_synced_at
                  : null,
              ownerName: trimmedName || 'Code Monarch',
              ownerAvatarUrl: null,
              buildings: [],
              githubStats: syncPayload.githubStats ?? null,
            })
            window.setTimeout(() => {
              setStep(3)
            }, 450)
            return
          }

          throw new Error(kingdomPayload.error ?? 'Unable to load kingdom summary')
        }

        setSummary(kingdomPayload.kingdom)
        window.setTimeout(() => {
          setStep(3)
        }, 450)
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Unable to forge your kingdom')
        hasStartedSyncRef.current = false
      } finally {
        window.clearInterval(stageTimer)
      }
    }

    void runSync()

    return () => {
      window.clearInterval(stageTimer)
    }
  }, [step, trimmedName])

  const handleNext = async () => {
    if (trimmedName.length < 2) {
      setSyncError('Kingdom name must be at least 2 characters.')
      return
    }

    setIsSubmittingName(true)
    setSyncError(null)

    try {
      const response = await fetch('/api/kingdom/set-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: trimmedName }),
      })

      const payload = await parseJsonResponse<{ success?: boolean; error?: string }>(response)

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to save kingdom name')
      }

      setStep(2)
      setSyncIndex(0)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to save kingdom name')
    } finally {
      setIsSubmittingName(false)
    }
  }

  const handleRetrySync = () => {
    setSyncIndex(0)
    setSyncError(null)
    hasStartedSyncRef.current = false
    setStep(2)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.2),transparent_28%),linear-gradient(180deg,#17111e_0%,#09070d_100%)] px-4 py-10 text-[#f5efe1] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map((currentStep) => (
            <div
              key={currentStep}
              className={[
                'h-2 rounded-full transition-all duration-500',
                step >= currentStep ? 'w-20 bg-[#C9A84C]' : 'w-10 bg-white/10',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="relative min-h-[620px] rounded-[36px] border border-[#C9A84C]/20 bg-[linear-gradient(180deg,rgba(24,17,32,0.96),rgba(10,8,15,0.97))] p-6 shadow-[0_28px_110px_rgba(0,0,0,0.45)] sm:p-10">
          <section
            className={[
              'absolute inset-0 p-6 transition duration-500 sm:p-10',
              step === 1 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <div className="grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#C9A84C]/75">Step 1</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                  Name your kingdom
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                  Choose a title worthy of your code. You can change it now and forge the realm in the next step.
                </p>

                <div className="mt-8">
                  <label htmlFor="kingdom-name" className="text-sm font-medium text-white/75">
                    Kingdom name
                  </label>
                  <input
                    id="kingdom-name"
                    value={name}
                    maxLength={30}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#120f1a] px-4 py-4 text-lg text-white outline-none transition placeholder:text-white/25 focus:border-[#C9A84C]/65"
                    placeholder="The Commit Crown"
                  />
                  <div className="mt-3 flex items-center justify-between text-sm text-white/45">
                    <span>Live preview updates instantly.</span>
                    <span>{trimmedName.length}/30</span>
                  </div>
                </div>

                {syncError ? <p className="mt-5 text-sm text-[#ff9d9d]">{syncError}</p> : null}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmittingName}
                  className="mt-8 rounded-2xl bg-[#C9A84C] px-6 py-4 text-sm font-semibold text-[#24180a] transition hover:bg-[#ddb966] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
                >
                  {isSubmittingName ? 'Saving name...' : 'Next'}
                </button>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.15),transparent_30%),linear-gradient(180deg,#1c1525_0%,#0f0c14_100%)] p-8">
                <p className="text-center text-xs uppercase tracking-[0.3em] text-[#C9A84C]/75">Live Preview</p>
                <div className="mt-6 flex flex-col items-center">
                  <div className="relative h-48 w-48">
                    <div className="absolute left-7 top-16 h-20 w-28 -skew-x-[28deg] rounded-2xl bg-[#362845]" />
                    <div className="absolute left-12 top-6 h-24 w-24 rotate-45 rounded-3xl border border-[#f1d07a]/30 bg-[linear-gradient(135deg,#d0a958,#885d21)] shadow-[0_18px_40px_rgba(201,168,76,0.28)]" />
                    <div className="absolute left-6 top-20 h-16 w-16 rounded-t-[28px] bg-[#7a5632]" />
                    <div className="absolute right-6 top-20 h-16 w-16 rounded-t-[28px] bg-[#7a5632]" />
                    <div className="absolute left-[84px] top-12 h-24 w-12 rounded-t-[18px] bg-[#f1d07a]" />
                    <div className="absolute bottom-8 left-10 right-10 h-12 rounded-[18px] border border-white/10 bg-[#18121f]" />
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-[#f7f1e4]">
                    {trimmedName.length >= 2 ? trimmedName : 'Your Kingdom'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            className={[
              'absolute inset-0 p-6 transition duration-500 sm:p-10',
              step === 2 ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="h-24 w-24 rounded-full border border-[#C9A84C]/35 border-t-[#C9A84C] animate-spin" />
              <p className="mt-8 text-xs uppercase tracking-[0.35em] text-[#C9A84C]/75">Step 2</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Your kingdom is being forged...
              </h2>

              <div className="mt-10 w-full max-w-xl space-y-4 text-left">
                {SYNC_STAGES.map((stage, index) => {
                  const isActive = index <= syncIndex && !syncError

                  return (
                    <div
                      key={stage}
                      className={[
                        'rounded-2xl border px-5 py-4 transition',
                        isActive
                          ? 'border-[#C9A84C]/40 bg-[#21180d] text-[#f3d68c]'
                          : 'border-white/10 bg-white/[0.03] text-white/45',
                      ].join(' ')}
                    >
                      {stage}
                    </div>
                  )
                })}
              </div>

              {syncError ? (
                <div className="mt-8 max-w-xl rounded-2xl border border-[#a84d4d]/40 bg-[#2a1111]/80 px-5 py-4 text-left text-[#ffc7c7]">
                  <p className="text-sm">{syncError}</p>
                  <button
                    type="button"
                    onClick={handleRetrySync}
                    className="mt-4 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#24180a]"
                  >
                    Retry forging
                  </button>
                </div>
              ) : (
                <p className="mt-8 text-sm text-white/55">This usually finishes in well under two minutes.</p>
              )}
            </div>
          </section>

          <section
            className={[
              'absolute inset-0 p-6 transition duration-500 sm:p-10',
              step === 3 ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-2xl rounded-[32px] border border-[#C9A84C]/25 bg-[linear-gradient(180deg,#1d1626_0%,#0f0b14_100%)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[#C9A84C]/75">Step 3</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">Your kingdom awaits</h2>
                <p className="mt-4 text-base leading-7 text-white/68">
                  The first structures are in place. Step into the realm and keep shipping code to expand it.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Kingdom Name</p>
                    <p className="mt-3 text-2xl font-semibold text-[#f7f1e4]">{summary?.name ?? trimmedName}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Buildings Generated</p>
                    <p className="mt-3 text-2xl font-semibold text-[#f7f1e4]">{totalBuildings}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Top Language Building</p>
                    <p className="mt-3 text-2xl font-semibold text-[#f7f1e4]">{topLanguageBuilding}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Prestige Score</p>
                    <p className="mt-3 text-2xl font-semibold text-[#f7f1e4]">{summary?.prestige ?? 0}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/kingdom')}
                  className="mt-8 rounded-2xl bg-[#C9A84C] px-6 py-4 text-sm font-semibold text-[#24180a] transition hover:bg-[#ddb966]"
                >
                  Enter your kingdom {'->'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
