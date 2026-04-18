'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function RevealGrid({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If already in view on mount (e.g. user refreshed mid-page), reveal immediately
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          obs.disconnect()
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
