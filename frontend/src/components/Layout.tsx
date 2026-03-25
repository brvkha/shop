import { useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { Breadcrumbs } from './navigation/Breadcrumbs'

type NavSection = 'flashcard' | 'listening'

export function Layout() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)
  const pushSuccess = useNotificationStore((state) => state.pushSuccess)
  const { pathname } = useLocation()

  const currentSection: NavSection = pathname.startsWith('/listening') ? 'listening' : 'flashcard'

  const sectionItems = useMemo(
    () =>
      currentSection === 'flashcard'
        ? [
            { label: 'Decks', to: '/flashcard/decks', active: pathname.startsWith('/flashcard/decks') },
            { label: 'Cards', to: '/flashcard/cards', active: pathname.startsWith('/flashcard/cards') },
            { label: 'Study', to: '/flashcard/study', active: pathname.startsWith('/flashcard/study') },
            { label: 'Settings', to: '/flashcard/settings', active: pathname.startsWith('/flashcard/settings') },
          ]
        : [{ label: 'Listening Home', to: '/listening', active: pathname.startsWith('/listening') }],
    [currentSection, pathname],
  )

  const primaryTabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-1.5 text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`

  const sidebarLinkClass = (isActive: boolean) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto max-w-6xl p-4">
          <nav className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <Link className="text-lg font-semibold" to="/flashcard/decks">
                KhaLeo
              </Link>
              <NavLink className={primaryTabClass} to="/flashcard/decks">
                Flashcard
              </NavLink>
              <NavLink className={primaryTabClass} to="/listening">
                Listening
              </NavLink>
              {currentUser?.role === 'ADMIN' ? (
                <NavLink className={primaryTabClass} to="/admin">
                  Admin
                </NavLink>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <span className="text-sm text-slate-600">{currentUser.email}</span>
                  <button
                    className="rounded bg-slate-900 px-3 py-1 text-white"
                    onClick={() => {
                      void logout().then(() => pushSuccess('Đăng xuất thành công.'))
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
            </div>
          </nav>

          <div className="mt-3">
            <Breadcrumbs />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {sectionItems.map((item) => (
              <Link
                className={`whitespace-nowrap rounded px-3 py-1.5 text-sm ${
                  item.active ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-4 p-4">
        <aside className="hidden w-32 shrink-0 rounded-xl border border-slate-200 bg-white p-3 md:block">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {currentSection === 'flashcard' ? 'Flashcard' : 'Listening'}
          </p>
          <nav className="space-y-1">
            {sectionItems.map((item) => (
              <Link className={sidebarLinkClass(item.active)} key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
