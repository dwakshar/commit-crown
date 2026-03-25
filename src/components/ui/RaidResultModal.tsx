'use client'

import Link from 'next/link'

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

type RaidResultModalProps = {
  open: boolean
  raid: RaidResult | null
  onClose: () => void
}

export function RaidResultModal({ open, raid, onClose }: RaidResultModalProps) {
  if (!open || !raid) {
    return null
  }

  const didWin = raid.result === 'attacker_win'

  return (
    <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[30px] border border-[#C9A84C]/30 bg-[linear-gradient(180deg,#171120,#0f0b17)] p-6 text-[#f7f1e4] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Raid Outcome</p>
        <h3 className="mt-3 text-3xl font-semibold">
          {didWin ? 'Victory in the Shadows' : 'Defenses Held'}
        </h3>

        <div className="mt-5 flex h-24 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
          {didWin ? (
            <div className="flex items-center gap-3 text-[#C9A84C]">
              <span className="animate-bounce text-3xl">◉</span>
              <span className="animate-bounce [animation-delay:120ms] text-3xl">→</span>
              <span className="animate-bounce [animation-delay:240ms] text-3xl">◉</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[#C9A84C]">
              <span className="text-3xl">⚔</span>
              <span className="text-4xl">⛨</span>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Attack Power</p>
            <p className="mt-2 text-2xl font-semibold text-[#C9A84C]">{raid.attackPower}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Defense Power</p>
            <p className="mt-2 text-2xl font-semibold text-[#C9A84C]">{raid.defensePower}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm leading-6 text-white/75">
            {didWin
              ? `You broke through ${raid.defenderName}'s defenses and seized ${raid.goldStolen} gold.`
              : `${raid.defenderName}'s defenses blocked the raid. No gold was stolen.`}
          </p>
          <div className="mt-4 flex justify-between text-sm text-white/70">
            <span>Your treasury: {raid.attackerGold}</span>
            <span>Defender treasury: {raid.defenderGold}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Link
            href="/raids/history"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Raid Log
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#22190b]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
