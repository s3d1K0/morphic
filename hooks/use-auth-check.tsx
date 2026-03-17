'use client'

export function useAuthCheck() {
  return {
    user: { id: 'local-user', email: 'local@vision.local' },
    loading: false,
    isAuthenticated: true
  }
}
