'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  alpha: number
  alphaSpeed: number
  alphaDir: 1 | -1
}

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let w = 0
    let h = 0
    const stars: Star[] = []

    function resize() {
      w = canvas!.offsetWidth
      h = canvas!.offsetHeight
      canvas!.width = w
      canvas!.height = h
    }

    function seedStars() {
      stars.length = 0
      const count = Math.min(Math.floor((w * h) / 6500), 120)
      for (let i = 0; i < count; i++) {
        const alpha = Math.random() * 0.55 + 0.15
        stars.push({
          x: Math.random() * w,
          // keep stars in upper 68% — mountains cover the rest
          y: Math.random() * h * 0.68,
          r: Math.random() * 1.1 + 0.25,
          alpha,
          alphaSpeed: Math.random() * 0.006 + 0.002,
          alphaDir: Math.random() > 0.5 ? 1 : -1,
        })
      }
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h)

      for (const s of stars) {
        s.alpha += s.alphaSpeed * s.alphaDir
        if (s.alpha > 0.75) { s.alpha = 0.75; s.alphaDir = -1 }
        if (s.alpha < 0.08) { s.alpha = 0.08; s.alphaDir = 1 }

        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(240,244,248,${s.alpha.toFixed(3)})`
        ctx!.fill()
      }

      animId = requestAnimationFrame(frame)
    }

    resize()
    seedStars()
    animId = requestAnimationFrame(frame)

    const ro = new ResizeObserver(() => { resize(); seedStars() })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
