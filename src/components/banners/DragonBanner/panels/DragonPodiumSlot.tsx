'use client'

import { dragonPanelBg } from '@/src/components/banners/DragonBanner/DragonBannerImages'

/**
 * Dragon Banner — Podium slot components (LeaderboardPodium).
 * Exports:
 *   DragonPodiumBar   — animated fire bar replacing the default rank bar
 *   DragonPodiumAvatar — glowing dragon avatar replacing the default circle
 */

export function DragonPodiumBar({ rank, label }: { rank: 1 | 2 | 3; label: string }) {
  const heights: Record<1 | 2 | 3, number> = { 1: 68, 2: 48, 3: 34 }
  const h = heights[rank]

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: h,
        ...dragonPanelBg(
          'podium',
          'linear-gradient(0deg,rgba(100,6,4,.78) 0%,rgba(50,3,2,.72) 45%,rgba(16,1,1,.65) 100%)'
        ),
      }}
    >
      <style>{`
        @keyframes pb-glow{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes pb-fire{0%,100%{clip-path:polygon(0% 100%,8% 55%,18% 78%,28% 20%,38% 62%,48% 4%,58% 48%,68% 18%,78% 58%,88% 28%,100% 100%)}50%{clip-path:polygon(0% 100%,10% 48%,20% 72%,30% 16%,40% 58%,50% 0%,60% 44%,70% 14%,80% 54%,90% 22%,100% 100%)}}
        @keyframes pb-ember{0%{transform:translateY(0) translateX(0);opacity:.9}100%{transform:translateY(-22px) translateX(var(--drift));opacity:0}}
        @keyframes pb-scalescroll{from{background-position:0 0}to{background-position:0 18px}}
      `}</style>

      {/* Scale texture */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[.07]"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'pb-scalescroll 6s linear infinite' }}
      >
        <defs>
          <pattern id={`pb-sc-${rank}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="none" stroke="#d4a830" strokeWidth=".5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pb-sc-${rank})`} />
      </svg>

      {/* Fire strip at top */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: Math.min(22, h * 0.4),
          background: 'linear-gradient(0deg,transparent,rgba(255,90,10,.45),rgba(255,180,30,.2))',
          animation: 'pb-fire .85s ease-in-out infinite',
        }}
      />

      {/* Gold top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg,transparent,rgba(212,168,48,.8),rgba(255,220,80,.6),rgba(212,168,48,.8),transparent)',
          animation: 'pb-glow 2s ease-in-out infinite',
        }}
      />

      {/* Side borders */}
      <div
        className="absolute inset-y-0 left-0 w-px"
        style={{ background: 'linear-gradient(180deg,rgba(212,168,48,.5),rgba(200,50,10,.4),transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-px"
        style={{ background: 'linear-gradient(180deg,rgba(212,168,48,.5),rgba(200,50,10,.4),transparent)' }}
      />

      {/* Ember particles */}
      {([
        { l: '20%', d: '-6px' },
        { l: '50%', d: '5px' },
        { l: '78%', d: '-4px' },
      ]).map((e, i) => (
        <div
          key={i}
          className="pointer-events-none absolute top-1"
          style={{
            left: e.l,
            width: 2,
            height: 2,
            background: i % 2 === 0 ? '#ff5020' : '#ffaa30',
            boxShadow: '0 0 4px #ff3000',
            ['--drift' as string]: e.d,
            animation: `pb-ember ${1.8 + i * 0.4}s ${i * 0.5}s ease-out infinite`,
          }}
        />
      ))}

      {/* Rank label */}
      <div
        className="relative flex h-full items-center justify-center font-[var(--font-display)]"
        style={{
          fontSize: rank === 1 ? '2.4rem' : '1.9rem',
          color: '#d4a830',
          textShadow: '0 0 18px rgba(220,100,20,.7),0 0 40px rgba(180,30,10,.4)',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export function DragonPodiumAvatar({ username, rank }: { username: string; rank: 1 | 2 | 3 }) {
  const size = rank === 1 ? 76 : 60
  const borderColor = rank === 1 ? 'rgba(212,168,48,.9)' : 'rgba(200,80,20,.7)'

  return (
    <div
      className="relative flex items-center justify-center rounded-full font-[var(--font-head)] text-[var(--silver-0)]"
      style={{
        width: size,
        height: size,
        border: `2px solid ${borderColor}`,
        background: 'linear-gradient(135deg,rgba(60,6,6,.95),rgba(30,3,3,.9))',
        boxShadow: '0 0 28px rgba(200,50,10,.5),0 0 56px rgba(180,30,10,.2)',
        fontSize: rank === 1 ? 30 : 24,
      }}
    >
      {rank === 1 && <span className="absolute -top-5 text-lg">🐉</span>}
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}
