import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      currentUser: null,
      login: useAuthStore.getState().login,
      register: useAuthStore.getState().register,
      logout: useAuthStore.getState().logout,
      bootstrap: useAuthStore.getState().bootstrap,
      banUser: useAuthStore.getState().banUser,
    })
  })

  it('logs in admin based on email and logs out', () => {
    useAuthStore.getState().login('admin@khaleo.app')
    expect(useAuthStore.getState().currentUser?.role).toBe('ADMIN')

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().currentUser).toBeNull()
  })

  it('persists and bootstraps user session', () => {
    useAuthStore.getState().register('user@khaleo.app')
    useAuthStore.setState({
      ...useAuthStore.getState(),
      currentUser: null,
    })

    useAuthStore.getState().bootstrap()
    expect(useAuthStore.getState().currentUser?.email).toBe('user@khaleo.app')
  })
})
