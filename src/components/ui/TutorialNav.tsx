'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV = [
  { id: 'step-01', num: '01', title: 'Sign In With GitHub' },
  { id: 'step-02', num: '02', title: 'Kingdom Creation' },
  { id: 'step-03', num: '03', title: 'Dashboard Overview' },
  { id: 'step-04', num: '04', title: 'Resources Explained' },
  { id: 'step-05', num: '05', title: 'Placing Buildings' },
  { id: 'step-06', num: '06', title: 'Upgrading Buildings' },
  { id: 'step-07', num: '07', title: 'Streaks & Army Power' },
  { id: 'step-08', num: '08', title: 'GitHub Sync' },
  { id: 'step-09', num: '09', title: 'Explore Other Realms' },
  { id: 'step-10', num: '10', title: 'Initiating a Raid' },
  { id: 'step-11', num: '11', title: 'During a Raid' },
  { id: 'step-12', num: '12', title: 'The Leaderboard' },
  { id: 'step-13', num: '13', title: 'Shop & Cosmetics' },
  { id: 'video',   num: '▶',  title: 'Video Walkthrough' },
]

export function TutorialNav() {
  const [active, setActive] = useState('step-01')

  useEffect(() => {
    function onScroll() {
      const threshold = window.innerHeight * 0.3
      let current = NAV[0].id
      for (const { id } of NAV) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= threshold) {
          current = id
        }
      }
      setActive(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="hidden lg:flex flex-col w-[220px] flex-shrink-0 sticky top-8 self-start max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[var(--silver-3)] hover:text-[var(--silver-1)] transition-colors mb-8">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </Link>

        {/* Label */}
        <div className="text-[9px] tracking-[0.28em] uppercase text-[var(--steel-6)] mb-4 font-[var(--font-head)]">
          Contents
        </div>

        {/* Step list */}
        <ol className="space-y-0.5">
          {NAV.map(({ id, num, title }) => {
            const isActive = active === id
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`flex items-center gap-3 px-3 py-2 text-[11px] transition-colors group ${
                    isActive
                      ? 'bg-[var(--steel-2)] text-[var(--silver-0)]'
                      : 'text-[var(--silver-3)] hover:text-[var(--silver-1)]'
                  }`}>
                  <span
                    className={`font-[var(--font-head)] text-[9px] tracking-[0.16em] w-5 flex-shrink-0 ${
                      isActive ? 'text-[var(--ember)]' : 'text-[var(--steel-6)]'
                    }`}>
                    {num}
                  </span>
                  <span className="leading-snug">{title}</span>
                  {isActive && (
                    <span className="ml-auto w-1 h-1 bg-[var(--ember)] flex-shrink-0" />
                  )}
                </a>
              </li>
            )
          })}
        </ol>

        {/* Divider */}
        <div className="mt-8 h-px bg-gradient-to-r from-[var(--b1)] to-transparent" />

        {/* Progress hint */}
        <p className="mt-4 text-[9px] leading-relaxed text-[var(--steel-6)]">
          13 steps · ~12 min read
        </p>
      </div>
    </nav>
  )
}
