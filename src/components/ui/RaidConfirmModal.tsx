'use client'

import { useMemo, useState } from 'react'

import { RaidResultModal } from '@/src/components/ui/RaidResultModal'

type RaidResult = {
  id: string
  result: 'attacker_win' | 'defender_win'
  attackPower: number
  defensePower: number
  goldStolen: number
  attackerGold: number
  defenderGold: number
  defenderName: string
}

type RaidConfirmModalProps = {
  open: boolean
  attackerName: string
  attackerAttackRating: number
  attackerGold: number
  defenderId: string
  defenderName: string
  defenderDefenseRating: number
  defenderGold: number
  onClose: () => void
}

export function RaidConfirmModal({
  open,
  attackerName,
  attackerAttackRating,
  attackerGold,
  defenderId,
  defenderName,
  defenderDefenseRating,
  defenderGold,
  onClose,
}: RaidConfirmModalProps) {
  const [isLaunching, setIsLaunching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [raidResult, setRaidResult] = useState<RaidResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const estimatedWinProbability = useMemo(() => {
    const total = attackerAttackRating + defenderDefenseRating
    if (total <= 0) {
      return 50
    }

    return Math.round((attackerAttackRating / total) * 100)
  }, [attackerAttackRating, defenderDefenseRating])

  if (!open) {
    return null
  }

  const handleLaunchRaid = async () => {
    setIsLaunching(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/raid/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defenderId }),
      })

      const payload = (await response.json()) as {
        error?: string
        availableAt?: string
        raid?: RaidResult
      }

      if (!response.ok || !payload.raid) {
        if (response.status === 429 && payload.availableAt) {
          throw new Error(`Cooldown active until ${new Date(payload.availableAt).toLocaleString()}`)
        }

        if (response.status === 403 && payload.error === 'raids_disabled') {
          throw new Error('This kingdom is not accepting raids.')
        }

        throw new Error(payload.error ?? 'Raid failed')
      }

      setRaidResult(payload.raid)
      setShowResult(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Raid failed')
    } finally {
      setIsLaunching(false)
    }
  }

  const didWin = raidResult?.result === 'attacker_win'

  return (
    <>
      <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-[30px] border border-[#C9A84C]/30 bg-[linear-gradient(180deg,#171120,#0f0b17)] p-6 text-[#f7f1e4] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Raid Council</p>
          <h3 className="mt-3 text-3xl font-semibold">Prepare the Raid</h3>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Attacker</p>
              <h4 className="mt-2 text-2xl font-semibold">{attackerName}</h4>
              <p className="mt-4 text-sm text-white/70">Attack Rating</p>
              <p className="mt-1 text-3xl font-semibold text-[#C9A84C]">{attackerAttackRating}</p>
              <p className="mt-4 text-sm text-white/70">Gold</p>
              <p className="mt-1 text-xl font-semibold text-[#C9A84C]">{attackerGold}</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-[0.24em] text-white/45">Estimated Win Rate</span>
              <span className="mt-3 text-4xl font-semibold text-[#C9A84C]">{estimatedWinProbability}%</span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">Defender</p>
              <h4 className="mt-2 text-2xl font-semibold">{defenderName}</h4>
              <p className="mt-4 text-sm text-white/70">Defense Rating</p>
              <p className="mt-1 text-3xl font-semibold text-[#C9A84C]">{defenderDefenseRating}</p>
              <p className="mt-4 text-sm text-white/70">Gold</p>
              <p className="mt-1 text-xl font-semibold text-[#C9A84C]">{defenderGold}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
            {isLaunching ? (
              <div className="flex h-20 items-center justify-center">
                {didWin ? (
                  <div className="flex items-center gap-3 text-[#C9A84C]">
                    <span className="animate-bounce text-2xl">◉</span>
                    <span className="animate-bounce [animation-delay:120ms] text-2xl">◉</span>
                    <span className="animate-bounce [animation-delay:240ms] text-2xl">◉</span>
                  </div>
                ) : (
                  <div className="text-3xl text-[#C9A84C]">⛨</div>
                )}
              </div>
            ) : (
              <p className="text-sm leading-6 text-white/72">
                The final outcome is resolved entirely on the server. A successful raid can steal up to 10%
                of the defender&apos;s current gold, and the same attacker cannot target the same defender again
                for 24 hours.
              </p>
            )}
          </div>

          {errorMessage ? <p className="mt-4 text-sm text-[#ff9696]">{errorMessage}</p> : null}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunchRaid}
              disabled={isLaunching}
              className="rounded-2xl bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#22190b] transition hover:bg-[#d7b864] disabled:cursor-not-allowed disabled:bg-[#6e5b25] disabled:text-[#d2c7a3]"
            >
              {isLaunching ? 'Launching Raid...' : 'Launch Raid'}
            </button>
          </div>
        </div>
      </div>

      <RaidResultModal
        open={showResult}
        raid={raidResult}
        onClose={() => {
          setShowResult(false)
          onClose()
        }}
      />
    </>
  )
}
