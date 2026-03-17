'use client'

import { createContext, useContext } from 'react'

const UserContext = createContext(true)

export function UserProvider({
  children
}: {
  hasUser?: boolean
  children: React.ReactNode
}) {
  return <UserContext.Provider value={true}>{children}</UserContext.Provider>
}

export function useHasUser() {
  return useContext(UserContext)
}
