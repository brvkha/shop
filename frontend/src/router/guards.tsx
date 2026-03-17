import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function RequireAuth() {
  const currentUser = useAuthStore((state) => state.currentUser)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  if (currentUser.banned) {
    return <Navigate to="/blocked" replace />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const currentUser = useAuthStore((state) => state.currentUser)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  if (currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
