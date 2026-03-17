import { create } from 'zustand'
import type { User } from '../types'

type AuthState = {
  currentUser: User | null
  login: (email: string) => void
  register: (email: string) => void
  logout: () => void
  bootstrap: () => void
  banUser: (email: string) => void
}

const STORAGE_KEY = 'khaleo-user'

const readStoredUser = (): User | null => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

const persistUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return
  }
  localStorage.removeItem(STORAGE_KEY)
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  login: (email) => {
    const role = email.includes('admin') ? 'ADMIN' : 'USER'
    const user: User = {
      id: crypto.randomUUID(),
      email,
      role,
      verified: true,
      banned: false,
    }
    persistUser(user)
    set({ currentUser: user })
  },
  register: (email) => {
    const user: User = {
      id: crypto.randomUUID(),
      email,
      role: 'USER',
      verified: true,
      banned: false,
    }
    persistUser(user)
    set({ currentUser: user })
  },
  logout: () => {
    persistUser(null)
    set({ currentUser: null })
  },
  bootstrap: () => {
    set({ currentUser: readStoredUser() })
  },
  banUser: (email) => {
    set((state) => {
      if (!state.currentUser || state.currentUser.email !== email) {
        return state
      }
      const next = { ...state.currentUser, banned: true }
      persistUser(next)
      return { currentUser: next }
    })
  },
}))
