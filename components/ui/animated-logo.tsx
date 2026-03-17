'use client'

import { cn } from '@/lib/utils'

export function AnimatedLogo({
  className,
  ...props
}: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 256 256"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8', className)}
      {...props}
    >
      {/* Black head */}
      <circle cx="128" cy="128" r="128" fill="black" />

      {/* Eyelid mask for blink */}
      <clipPath id="eyelid">
        <ellipse
          cx="128"
          cy="128"
          rx="52"
          ry="52"
          className="animate-[eyeBlink_4s_ease-in-out_infinite]"
        />
      </clipPath>

      {/* Eye whites */}
      <ellipse
        cx="128"
        cy="128"
        rx="52"
        ry="52"
        fill="white"
        clipPath="url(#eyelid)"
      />

      {/* Iris + pupil group — looks around */}
      <g
        clipPath="url(#eyelid)"
        className="animate-[eyeLook_3s_ease-in-out_infinite] origin-center"
      >
        <circle cx="128" cy="128" r="28" fill="#1a1a2e" />
        <circle cx="128" cy="128" r="16" fill="black" />
        <circle cx="120" cy="120" r="6" fill="white" opacity="0.8" />
      </g>
    </svg>
  )
}
