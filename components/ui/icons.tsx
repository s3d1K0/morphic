'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

function IconLogo({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="black" />
      <ellipse cx="128" cy="128" rx="52" ry="52" fill="white" />
      <circle cx="128" cy="128" r="28" fill="#1a1a2e" />
      <circle cx="128" cy="128" r="16" fill="black" />
      <circle cx="120" cy="120" r="6" fill="white" opacity="0.8" />
    </svg>
  )
}

function IconLogoOutline({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle
        cx="128"
        cy="128"
        r="108"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
      ></circle>
      <circle cx="102" cy="128" r="18" fill="currentColor"></circle>
      <circle cx="154" cy="128" r="18" fill="currentColor"></circle>
    </svg>
  )
}

function IconBlinkingLogo({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const irisRef = useRef<SVGGElement>(null)
  const eyelidRef = useRef<SVGEllipseElement>(null)

  useEffect(() => {
    const iris = irisRef.current
    const eyelid = eyelidRef.current
    if (!iris || !eyelid) return

    // Blink animation
    const triggerBlink = () => {
      const ry = eyelid.getAttribute('ry')
      eyelid.setAttribute('ry', '4')
      setTimeout(() => {
        eyelid.setAttribute('ry', ry || '52')
      }, 150)
    }

    const randomInterval = () => Math.random() * 4000 + 2000
    let timeoutId: ReturnType<typeof setTimeout>
    const startBlinking = () => {
      triggerBlink()
      timeoutId = setTimeout(startBlinking, randomInterval())
    }
    startBlinking()

    // Mouse tracking
    const handleMove = (clientX: number, clientY: number) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const dx = clientX - centerX
      const dy = clientY - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxMove = 16
      const factor = Math.min(dist / 200, 1) * maxMove

      const moveX = (dx / (dist || 1)) * factor
      const moveY = (dy / (dist || 1)) * factor

      iris.setAttribute('transform', `translate(${moveX}, ${moveY})`)
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <circle cx="128" cy="128" r="128" fill="#222" />
      <clipPath id="eyelid-clip">
        <ellipse
          ref={eyelidRef}
          cx="128"
          cy="128"
          rx="52"
          ry="52"
          style={{ transition: 'ry 0.15s ease-in-out' }}
        />
      </clipPath>
      <ellipse
        cx="128"
        cy="128"
        rx="52"
        ry="52"
        fill="white"
        clipPath="url(#eyelid-clip)"
      />
      <g ref={irisRef} clipPath="url(#eyelid-clip)">
        <circle cx="128" cy="128" r="28" fill="#1a1a2e" />
        <circle cx="128" cy="128" r="16" fill="black" />
        <circle cx="120" cy="120" r="6" fill="white" opacity="0.8" />
      </g>
    </svg>
  )
}

export { IconBlinkingLogo, IconLogo, IconLogoOutline }
