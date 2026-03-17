import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { RequireAdmin, RequireAuth } from './guards'
import { useAuthStore } from '../store/authStore'

function renderGuard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<div>private</div>} />
        </Route>
        <Route path="/login" element={<div>login-page</div>} />
        <Route path="/blocked" element={<div>blocked-page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('route guards', () => {
  it('redirects anonymous user to login', () => {
    useAuthStore.setState({ ...useAuthStore.getState(), currentUser: null })
    renderGuard('/')
    expect(screen.getByText('login-page')).toBeInTheDocument()
  })

  it('allows authenticated user through auth guard', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      currentUser: {
        id: 'u1',
        email: 'user@khaleo.app',
        role: 'USER',
        verified: true,
        banned: false,
      },
    })
    renderGuard('/')
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('requires admin role for admin guard', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      currentUser: {
        id: 'u2',
        email: 'user@khaleo.app',
        role: 'USER',
        verified: true,
        banned: false,
      },
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<div>admin-panel</div>} />
          </Route>
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })
})
