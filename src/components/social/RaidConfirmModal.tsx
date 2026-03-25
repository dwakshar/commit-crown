'use client'

type RaidConfirmModalProps = {
  open: boolean
  defenderName: string
  onClose: () => void
}

export function RaidConfirmModal({ open, defenderName, onClose }: RaidConfirmModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-[#C9A84C]/30 bg-[linear-gradient(180deg,#171120,#0f0b17)] p-6 text-[#f7f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[#C9A84C]/75">Raid Council</p>
        <h3 className="mt-3 text-2xl font-semibold">Raid {defenderName}?</h3>
        <p className="mt-3 text-sm leading-6 text-white/72">
          Raid matchmaking is not wired yet, but the kingdom is raid-eligible and ready for the next
          combat layer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#22190b]"
          >
            Soon
          </button>
        </div>
      </div>
    </div>
  )
}
