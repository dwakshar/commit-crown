'use client'

import { dragonPanelBg } from '@/src/components/banners/DragonBanner/DragonBannerImages'

/**
 * Dragon Banner — Crown Realm panel (HUD top-left cell).
 * Drop-in replacement for the default Crown Realm <div> when the Dragon Banner is equipped.
 */
export function DragonCrownRealm({
  kingdomName,
  ownerName,
  control,
}: {
  kingdomName: string
  ownerName: string
  control: string
}) {
  return (
    <div
      className="relative overflow-hidden border-b border-[rgba(180,30,10,0.45)] px-5 py-4 xl:border-b-0 xl:border-r xl:border-r-[rgba(180,30,10,0.35)]"
      style={dragonPanelBg('crownRealm')}
    >
      <style>{`
        @keyframes hud-glow{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes hud-ember{0%{transform:translateY(0) translateX(0);opacity:.9}100%{transform:translateY(-28px) translateX(var(--drift));opacity:0}}
        @keyframes hud-pulse{0%,100%{opacity:.4}50%{opacity:.7}}
      `}</style>

      {/* Scale texture */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[.045]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hud-sc" x="0" y="0" width="13" height="13" patternUnits="userSpaceOnUse">
            <path d="M6.5 0 L13 6.5 L6.5 13 L0 6.5 Z" fill="none" stroke="#d4a830" strokeWidth=".5" />
            <circle cx="6.5" cy="6.5" r=".6" fill="#d4a830" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hud-sc)" />
      </svg>

      {/* Left fire stripe */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: 'linear-gradient(180deg,transparent,rgba(220,60,10,.85),rgba(255,100,20,.6),transparent)',
          animation: 'hud-glow 2.5s ease-in-out infinite',
        }}
      />

      {/* Top gold line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(212,168,48,.45),rgba(255,210,80,.3),transparent)' }}
      />

      {/* Bottom fire line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg,transparent,rgba(200,45,10,.65),rgba(255,85,20,.45),transparent)',
          animation: 'hud-pulse 1.8s ease-in-out infinite',
        }}
      />

      {/* Ember particles */}
      {([
        { l: '18%', d: '-7px' },
        { l: '50%', d: '8px' },
        { l: '78%', d: '-5px' },
      ] as { l: string; d: string }[]).map((e, i) => (
        <div
          key={i}
          className="pointer-events-none absolute bottom-2"
          style={{
            left: e.l,
            width: 3,
            height: 3,
            background: i % 2 === 0 ? '#ff5020' : '#ff9030',
            boxShadow: '0 0 5px #ff3000',
            ['--drift' as string]: e.d,
            animation: `hud-ember ${2 + i * 0.6}s ${i * 0.7}s ease-out infinite`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(212,148,30,.8)' }}>
          Crown Realm
        </div>
        <div
          className="mt-2 font-[var(--font-head)] text-[2rem] leading-none text-[var(--silver-0)]"
          style={{ textShadow: '0 0 22px rgba(180,30,10,.45)' }}
        >
          {kingdomName}
        </div>
        <div className="mt-2 text-sm italic text-[var(--silver-2)]">
          Commanded by @{ownerName.toLowerCase().replace(/\s+/g, '')} / {control}
        </div>
      </div>
    </div>
  )
}
