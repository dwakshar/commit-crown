'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { RealmTopNav } from '@/src/components/ui/RealmTopNav'
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

const STEPS = [
  { key: 1 as Step, label: 'Name Realm', eyebrow: 'Declare your kingdom' },
  { key: 2 as Step, label: 'Forge', eyebrow: 'Summoning from code' },
  { key: 3 as Step, label: 'Enter', eyebrow: 'Your realm awaits' },
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

  const heroEyebrow = STEPS.find((s) => s.key === step)?.eyebrow ?? 'Initiation'
  const heroTitle = step === 1
    ? 'Forge Your Realm'
    : step === 2
      ? 'Summoning Your Kingdom'
      : 'Your Kingdom Awaits'

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#05070b_0%,#0b1018_100%)] text-[var(--silver-1)]">
      <div>
        <RealmTopNav active="kingdom" />
      </div>

      {/* Hero Section - Marketplace Style */}
      <section className="border-b border-[var(--b1)] bg-[radial-gradient(ellipse_at_top,rgba(120,145,170,0.12),transparent_55%),linear-gradient(180deg,rgba(16,20,30,0.96),rgba(11,16,24,0.96))] px-6 py-12 md:px-20">
        <div className="mx-auto max-w-[1840px]">
          <p className="realm-label text-[var(--plate-hi)]">
            CodeKingdom Initiation
          </p>
          <h1 className="realm-page-title mt-4 text-[clamp(2.8rem,6vw,4.8rem)] font-bold leading-[0.92]">
            {heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-[var(--ember)]">
              {heroTitle.split(' ').slice(-1)}
            </span>
          </h1>
          <p className="realm-lore mt-4 max-w-3xl text-base">
            Every repository becomes territory. Every streak hardens the walls.
            Shape the kingdom that your GitHub history deserves.
          </p>
        </div>
      </section>

      {/* Step Tabs - Marketplace Filter Style */}
      <section className="border-b border-[var(--b1)] bg-[rgba(3,4,6,0.58)]">
        <div className="mx-auto flex max-w-[1840px] overflow-x-auto px-6 md:px-9">
          {STEPS.map((stepItem) => {
            const isActive = stepItem.key === step
            const isPast = step > stepItem.key

            return (
              <button
                key={stepItem.key}
                type="button"
                onClick={() => {
                  if (isPast) setStep(stepItem.key)
                }}
                disabled={!isPast && stepItem.key !== step}
                className={`border-b-2 px-6 py-4 font-[var(--font-head)] text-[12px] uppercase tracking-[0.16em] transition ${
                  isActive
                    ? 'border-[var(--ember)] text-[var(--silver-0)]'
                    : isPast
                      ? 'border-transparent text-[var(--plate-hi)] hover:text-[var(--silver-1)]'
                      : 'border-transparent text-[var(--silver-3)] opacity-60'
                }`}
              >
                {stepItem.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Main Content - Marketplace Layout */}
      <div className="mx-auto max-w-[1840px] px-6 py-10 md:px-9">
        <div className="grid gap-7 xl:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar - Step Navigation */}
          <aside className="h-fit border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(5,8,12,0.94),rgba(7,10,16,0.98))]">
            <div className="border-b border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Your Progress</p>
              <p className="mt-2 font-[var(--font-head)] text-sm uppercase tracking-[0.16em] text-[var(--silver-0)]">
                Realm Creation
              </p>
            </div>

            <div className="divide-y divide-[rgba(80,105,130,0.08)]">
              {STEPS.map((stepItem, index) => {
                const isActive = stepItem.key === step
                const isPast = step > stepItem.key

                return (
                  <button
                    key={stepItem.key}
                    type="button"
                    onClick={() => {
                      if (isPast) setStep(stepItem.key)
                    }}
                    disabled={!isPast && stepItem.key !== step}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition ${
                      isActive
                        ? 'bg-[linear-gradient(90deg,rgba(200,88,26,0.14),transparent)]'
                        : 'hover:bg-[rgba(255,255,255,0.02)]'
                    } ${!isPast && stepItem.key !== step ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center border font-[var(--font-head)] text-[10px] uppercase tracking-[0.12em] ${
                          isActive
                            ? 'border-[rgba(200,88,26,0.55)] text-[var(--ember-hi)]'
                            : isPast
                              ? 'border-[var(--ember-lo)] text-[var(--ember)]'
                              : 'border-[var(--b1)] text-[var(--silver-3)]'
                        }`}
                      >
                        {isPast ? '✓' : String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p
                          className={`font-[var(--font-head)] text-[11px] uppercase tracking-[0.16em] ${
                            isActive
                              ? 'text-[var(--silver-0)]'
                              : 'text-[var(--silver-2)]'
                          }`}
                        >
                          {stepItem.label}
                        </p>
                        <p className="mt-1 text-[11px] italic text-[var(--silver-3)]">
                          {stepItem.eyebrow}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-[var(--b1)] px-5 py-5">
              <p className="realm-label text-[10px]">Current Step</p>
              <p className="mt-3 text-sm text-[var(--silver-2)]">
                {step} of 3
              </p>
              <p className="mt-1 text-xs italic text-[var(--silver-3)]">
                {step === 1 && 'Name your kingdom to begin.'}
                {step === 2 && 'Forging from your code history...'}
                {step === 3 && 'Your realm is ready to enter.'}
              </p>
            </div>
          </aside>

          {/* Content Area */}
          <section>
            {/* Step 1: Name Your Kingdom */}
            {step === 1 && (
              <div className="border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(9,12,18,0.98))] p-8">
                <div className="mb-6 border-b border-[var(--b1)] pb-6">
                  <p className="realm-label text-[var(--plate-hi)]">Step 1</p>
                  <h2 className="realm-page-title mt-3 text-3xl">
                    Name Your Kingdom
                  </h2>
                  <p className="realm-lore mt-3 max-w-2xl">
                    Choose a title worthy of your code. You can change it now and forge the realm in the next step.
                  </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                  <div>
                    <label htmlFor="kingdom-name" className="realm-label block text-[var(--silver-2)]">
                      Kingdom name
                    </label>
                    <input
                      id="kingdom-name"
                      value={name}
                      maxLength={30}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-3 w-full border border-[var(--b1)] bg-[rgba(12,15,22,0.92)] px-5 py-4 text-lg text-[var(--silver-0)] outline-none transition placeholder:text-[var(--silver-4)] focus:border-[var(--ember)]"
                      placeholder="The Commit Crown"
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-[var(--silver-3)]">
                      <span>The heraldry updates as you type.</span>
                      <span>{trimmedName.length}/30</span>
                    </div>

                    {syncError ? (
                      <p className="mt-5 text-sm text-[#ff9d9d]">{syncError}</p>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmittingName}
                      className="realm-button realm-button-primary mt-8 px-6 py-4 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isSubmittingName ? 'Saving name...' : 'Begin Forging'}
                    </button>
                  </div>

                  {/* Preview Card */}
                  <div className="border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(5,8,12,0.94),rgba(7,10,16,0.98))] p-6">
                    <p className="realm-label text-center text-[var(--plate-hi)]">Live Preview</p>
                    <div className="mt-6 flex flex-col items-center">
                      <div className="relative h-48 w-48">
                        <div className="absolute inset-[24%] bg-[radial-gradient(circle,rgba(200,88,26,0.15),transparent_62%)]" />
                        <div className="absolute left-5 top-16 h-16 w-28 -skew-x-[28deg] bg-[var(--steel-3)]" />
                        <div className="absolute left-10 top-6 h-20 w-20 rotate-45 border border-[var(--b2)] bg-[linear-gradient(135deg,#6f8292,#273040)] shadow-[0_18px_40px_rgba(120,145,170,0.22)]" />
                        <div className="absolute left-4 top-20 h-12 w-12 bg-[var(--wood-3)]" />
                        <div className="absolute right-4 top-20 h-12 w-12 bg-[var(--wood-3)]" />
                        <div className="absolute left-[76px] top-10 h-20 w-10 bg-[linear-gradient(180deg,var(--ember-hi),var(--ember-lo))]" />
                        <div className="absolute bottom-8 left-8 right-8 h-10 border border-[var(--b1)] bg-[var(--steel-1)]" />
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
              </div>
            )}

            {/* Step 2: Forging */}
            {step === 2 && (
              <div className="border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(9,12,18,0.98))] p-8">
                <div className="mb-6 border-b border-[var(--b1)] pb-6 text-center">
                  <p className="realm-label text-[var(--plate-hi)]">Step 2</p>
                  <h2 className="realm-page-title mt-3 text-3xl">
                    Your Kingdom Is Being Forged
                  </h2>
                  <p className="realm-lore mt-3 max-w-2xl mx-auto">
                    Counting every commit, surveying each repository, and hammering your profile into a realm that feels alive.
                  </p>
                </div>

                <div className="mx-auto max-w-2xl">
                  <div className="mb-8 flex items-center justify-center">
                    <div className="h-16 w-16 border-2 border-[var(--b2)] border-t-[var(--ember)] animate-spin" />
                  </div>

                  <div className="space-y-3">
                    {SYNC_STAGES.map((stage, index) => {
                      const isActive = index <= syncIndex && !syncError

                      return (
                        <div
                          key={stage}
                          className={`border px-5 py-4 transition ${
                            isActive
                              ? 'border-[rgba(200,88,26,0.42)] bg-[rgba(44,21,13,0.74)] text-[var(--silver-0)]'
                              : 'border-[var(--b0)] bg-[rgba(255,255,255,0.03)] text-[var(--silver-3)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center border text-[10px] ${
                                isActive
                                  ? 'border-[var(--ember)] text-[var(--ember)]'
                                  : 'border-[var(--b1)] text-[var(--silver-4)]'
                              }`}
                            >
                              {isActive ? '✓' : String(index + 1)}
                            </span>
                            <span className="font-[var(--font-head)] text-sm uppercase tracking-[0.12em]">
                              {stage}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {syncError ? (
                    <div className="mt-8 border border-[#a84d4d]/40 bg-[#2a1111]/80 px-5 py-4 text-center text-[#ffc7c7]">
                      <p className="text-sm">{syncError}</p>
                      <button
                        type="button"
                        onClick={handleRetrySync}
                        className="realm-button realm-button-primary mt-4 px-4 py-2"
                      >
                        Retry Forging
                      </button>
                    </div>
                  ) : (
                    <p className="mt-8 text-center text-sm text-[var(--silver-3)]">
                      This usually finishes in well under two minutes.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Summary - Leaderboard Style Cards */}
            {step === 3 && (
              <div className="border border-[var(--b0)] bg-[linear-gradient(180deg,rgba(16,20,30,0.96),rgba(9,12,18,0.98))] p-8">
                <div className="mb-6 border-b border-[var(--b1)] pb-6 text-center">
                  <p className="realm-label text-[var(--plate-hi)]">Step 3</p>
                  <h2 className="realm-page-title mt-3 text-3xl">
                    Your Kingdom Awaits
                  </h2>
                  <p className="realm-lore mt-3 max-w-2xl mx-auto">
                    The first structures are in place. Step into the realm and keep shipping code to expand it.
                  </p>
                </div>

                {/* Summary Stats - Leaderboard Style */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-5">
                    <p className="realm-label text-[10px]">Kingdom Name</p>
                    <p className="mt-3 font-[var(--font-display)] text-2xl text-[var(--silver-0)]">
                      {summary?.name ?? trimmedName}
                    </p>
                  </div>
                  <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-5">
                    <p className="realm-label text-[10px]">Buildings Generated</p>
                    <p className="mt-3 font-[var(--font-display)] text-2xl text-[var(--silver-0)]">
                      {totalBuildings}
                    </p>
                  </div>
                  <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-5">
                    <p className="realm-label text-[10px]">Top Language</p>
                    <p className="mt-3 font-[var(--font-display)] text-2xl text-[var(--silver-0)]">
                      {topLanguageBuilding}
                    </p>
                  </div>
                  <div className="border border-[var(--b1)] bg-[rgba(7,10,16,0.72)] px-5 py-5">
                    <p className="realm-label text-[10px]">Prestige Score</p>
                    <p className="mt-3 font-[var(--font-display)] text-2xl text-[var(--ember)]">
                      {summary?.prestige ?? 0}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2">
                  <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Population</p>
                    <p className="mt-3 text-xl font-semibold text-[var(--silver-0)]">
                      {summary?.population ?? 0}
                    </p>
                  </div>
                  <div className="border border-[var(--b0)] bg-[rgba(255,255,255,0.03)] p-5">
                    <p className="realm-label">Defense Rating</p>
                    <p className="mt-3 text-xl font-semibold text-[var(--silver-0)]">
                      {summary?.defense_rating ?? 0}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push('/kingdom')}
                    className="realm-button realm-button-primary px-8 py-4"
                  >
                    Enter Your Kingdom
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}