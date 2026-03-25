import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listPrivateDecks } from '../../services/privateWorkspaceApi'

const LABEL_BY_SEGMENT: Record<string, string> = {
  flashcard: 'Flashcard',
  decks: 'Decks',
  cards: 'Cards',
  study: 'Study',
  session: 'Session',
  settings: 'Settings',
  listening: 'Listening',
  admin: 'Admin',
  users: 'Users',
  audit: 'Audit',
  blocked: 'Blocked',
  login: 'Login',
  register: 'Register',
}

function toLabel(segment: string, previous?: string, deckNameById?: Record<string, string>): string {
  if (LABEL_BY_SEGMENT[segment]) {
    return LABEL_BY_SEGMENT[segment]
  }
  if (previous === 'session') {
    return deckNameById?.[segment] ?? `Deck ${segment.slice(0, 8)}`
  }
  return decodeURIComponent(segment)
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  const [deckNameById, setDeckNameById] = useState<Record<string, string>>({})

  const sessionDeckId = useMemo(() => {
    const sessionIndex = segments.findIndex((segment) => segment === 'session')
    if (sessionIndex < 0 || sessionIndex === segments.length - 1) {
      return null
    }
    return segments[sessionIndex + 1]
  }, [segments])

  useEffect(() => {
    if (!sessionDeckId || deckNameById[sessionDeckId]) {
      return
    }

    let cancelled = false
    void listPrivateDecks('')
      .then((decks) => {
        if (cancelled) {
          return
        }
        const matched = decks.find((deck) => deck.id === sessionDeckId)
        if (!matched) {
          return
        }
        setDeckNameById((prev) => ({
          ...prev,
          [sessionDeckId]: matched.name,
        }))
      })
      .catch(() => {
        // Keep a fallback breadcrumb label when deck lookup fails.
      })

    return () => {
      cancelled = true
    }
  }, [deckNameById, sessionDeckId])

  if (segments.length === 0) {
    return (
      <div className="text-sm text-slate-600">
        <span className="font-medium text-slate-900">Home</span>
      </div>
    )
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link className="hover:text-slate-900" to="/">
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const isCurrent = index === segments.length - 1
          const previous = index > 0 ? segments[index - 1] : undefined
          const label = toLabel(segment, previous, deckNameById)

          return (
            <li className="flex items-center gap-1" key={href}>
              <span>/</span>
              {isCurrent ? (
                <span className="font-medium text-slate-900">{label}</span>
              ) : (
                <Link className="hover:text-slate-900" to={href}>
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
