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
    <main className="relative min-h-screen overflow-hidden px-4 py-10 text-[var(--silver-1)] sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.18),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(200,88,26,0.08),transparent_35%),linear-gradient(180deg,#030406_0%,#090d15_42%,#05070b_100%)]" />
        <div className="absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(200,88,26,0.12),transparent_70%)] blur-3xl" />
        <div className="absolute right-[10%] top-[20%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(143,164,184,0.12),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="realm-label text-[var(--plate-hi)]">CodeKingdom Initiation</p>
          <h1 className="realm-page-title mt-3 text-[clamp(2.5rem,5vw,4.7rem)]">Forge your realm</h1>
          <p className="realm-lore mx-auto mt-3 max-w-3xl text-base">
            Every repository becomes territory. Every streak hardens the walls. Shape the kingdom that your GitHub history deserves.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2, 3].map((currentStep) => (
            <div
              key={currentStep}
              className={[
                'h-2 rounded-full transition-all duration-500',
                step >= currentStep ? 'w-24 bg-[var(--ember)]' : 'w-12 bg-[rgba(255,255,255,0.08)]',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="realm-panel relative min-h-[680px] rounded-[36px] p-6 sm:p-10">
          <section
            className={[
              'absolute inset-0 p-6 transition duration-500 sm:p-10',
              step === 1 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0 pointer-events-none',
            ].join(' ')}
          >
            <div className="grid h-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="realm-label text-[var(--plate-hi)]">Step 1</p>
                <h1 className="realm-page-title mt-3 text-4xl sm:text-5xl">
                  Name your kingdom
                </h1>
                <p className="realm-lore mt-4 max-w-xl text-base">
                  Choose a title worthy of your code. You can change it now and forge the realm in the next step.
                </p>

                <div className="mt-8">
                  <label htmlFor="kingdom-name" className="realm-label block text-[var(--silver-2)]">
                    Kingdom name
                  </label>
                  <input
                    id="kingdom-name"
                    value={name}
                    maxLength={30}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-3 w-full rounded-[22px] border border-[var(--b1)] bg-[rgba(12,15,22,0.92)] px-5 py-4 text-lg text-[var(--silver-0)] outline-none transition placeholder:text-[var(--silver-4)] focus:border-[var(--ember)]"
                    placeholder="The Commit Crown"
                  />
                  <div className="mt-3 flex items-center justify-between text-sm text-[var(--silver-3)]">
                    <span>The heraldry updates as you type.</span>
                    <span>{trimmedName.length}/30</span>
                  </div>
                </div>

                {syncError ? <p className="mt-5 text-sm text-[#ff9d9d]">{syncError}</p> : null}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmittingName}
                  className="realm-button realm-button-primary mt-8 rounded-[18px] px-6 py-4 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isSubmittingName ? 'Saving name...' : 'Next'}
                </button>
              </div>

              <div className="realm-panel rounded-[32px] p-8">
                <p className="realm-label text-center text-[var(--plate-hi)]">Live Preview</p>
                <div className="mt-6 flex flex-col items-center">
                  <div className="relative h-56 w-56">
                    <div className="absolute inset-[24%] rounded-full bg-[radial-gradient(circle,rgba(200,88,26,0.15),transparent_62%)] blur-xl" />
                    <div className="absolute left-7 top-20 h-20 w-32 -skew-x-[28deg] rounded-2xl bg-[var(--steel-3)]" />
                    <div className="absolute left-14 top-8 h-24 w-24 rotate-45 rounded-3xl border border-[var(--b2)] bg-[linear-gradient(135deg,#6f8292,#273040)] shadow-[0_18px_40px_rgba(120,145,170,0.22)]" />
                    <div className="absolute left-6 top-24 h-16 w-16 rounded-t-[28px] bg-[var(--wood-3)]" />
                    <div className="absolute right-6 top-24 h-16 w-16 rounded-t-[28px] bg-[var(--wood-3)]" />
                    <div className="absolute left-[91px] top-14 h-24 w-12 rounded-t-[18px] bg-[linear-gradient(180deg,var(--ember-hi),var(--ember-lo))]" />
                    <div className="absolute bottom-10 left-10 right-10 h-12 rounded-[18px] border border-[var(--b1)] bg-[var(--steel-1)]" />
                  </div>
                  <p className="realm-page-title mt-4 text-center text-2xl">
                    {trimmedName.length >= 2 ? trimmedName : 'Your Kingdom'}
                  </p>
                  <p className="realm-lore mt-3 text-center text-sm">
                    A steel citadel lit by ember fire, ready to transform your coding history into territory.
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
              <div className="h-24 w-24 rounded-full border border-[var(--b2)] border-t-[var(--ember)] animate-spin" />
              <p className="realm-label mt-8 text-[var(--plate-hi)]">Step 2</p>
              <h2 className="realm-page-title mt-3 text-4xl sm:text-5xl">
                Your kingdom is being forged...
              </h2>
              <p className="realm-lore mt-4 max-w-2xl">
                Counting every commit, surveying each repository, and hammering your profile into a realm that feels alive.
              </p>

              <div className="mt-10 w-full max-w-xl space-y-4 text-left">
                {SYNC_STAGES.map((stage, index) => {
                  const isActive = index <= syncIndex && !syncError

                  return (
                    <div
                      key={stage}
                      className={[
                        'rounded-[20px] border px-5 py-4 transition',
                        isActive
                          ? 'border-[rgba(200,88,26,0.42)] bg-[rgba(44,21,13,0.74)] text-[var(--silver-0)]'
                          : 'border-[var(--b0)] bg-[rgba(255,255,255,0.03)] text-[var(--silver-3)]',
                      ].join(' ')}
                    >
                      {stage}
                    </div>
                  )
                })}
              </div>

              {syncError ? (
                <div className="mt-8 max-w-xl rounded-[20px] border border-[#a84d4d]/40 bg-[#2a1111]/80 px-5 py-4 text-left text-[#ffc7c7]">
                  <p className="text-sm">{syncError}</p>
                  <button
                    type="button"
                    onClick={handleRetrySync}
                    className="realm-button realm-button-primary mt-4 rounded-[14px] px-4 py-2"
                  >
                    Retry forging
                  </button>
                </div>
              ) : (
                <p className="mt-8 text-sm text-[var(--silver-3)]">This usually finishes in well under two minutes.</p>
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
              <div className="realm-panel w-full max-w-3xl rounded-[32px] p-8">
                <p className="realm-label text-[var(--plate-hi)]">Step 3</p>
                <h2 className="realm-page-title mt-3 text-4xl">Your kingdom awaits</h2>
                <p className="realm-lore mt-4 text-base">
                  The first structures are in place. Step into the realm and keep shipping code to expand it.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Kingdom Name</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">{summary?.name ?? trimmedName}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Buildings Generated</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">{totalBuildings}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Top Language Building</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">{topLanguageBuilding}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Prestige Score</p>
                    <p className="mt-3 text-2xl font-semibold text-[var(--silver-0)]">{summary?.prestige ?? 0}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/kingdom')}
                  className="realm-button realm-button-primary mt-8 rounded-[18px] px-6 py-4"
                >
                  Enter your kingdom
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
