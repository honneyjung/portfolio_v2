import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../../types'

interface AuthStore {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isLoggedIn:   boolean
  setAuth:      (user: User, accessToken: string, refreshToken?: string) => void
  logout:       () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoggedIn:   false,
      setAuth: (user, accessToken, refreshToken = '') =>
        set({ user, accessToken, refreshToken, isLoggedIn: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isLoggedIn: false }),
    }),
    {
      name: 'hemily-auth',
      storage: {
        getItem: (key) => {
          const v = localStorage.getItem(key)
          return v ? JSON.parse(v) : null
        },
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => localStorage.removeItem(key),
      },
    }
  )
)
