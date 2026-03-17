'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { useSidebar } from '@/components/ui/sidebar'

import UserMenu from './user-menu'

export const Header: React.FC = () => {
  const { open } = useSidebar()
  const pathname = usePathname()

  return (
    <header
      className={cn(
        'absolute top-0 right-0 p-3 flex justify-between items-center z-10 backdrop-blur-sm lg:backdrop-blur-none bg-background/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      <div></div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  )
}

export default Header
