import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats, type AdminStatsDto } from '../../../services/adminApi'

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void getAdminStats()
      .then((payload) => setStats(payload))
      .catch((err) => {
        console.error('admin_stats_load_failed', err)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      {loading ? <p className="mt-3 text-sm text-slate-500">Loading stats...</p> : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section className="rounded border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-lg font-semibold">Flashcard Statistics</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <article className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Total decks</p>
              <p className="text-2xl font-semibold">{stats?.totalDecks ?? 0}</p>
            </article>
            <article className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Total cards</p>
              <p className="text-2xl font-semibold">{stats?.totalCards ?? 0}</p>
            </article>
            <article className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Reviews Last 24h</p>
              <p className="text-2xl font-semibold">{stats?.reviewsLast24Hours ?? 0}</p>
            </article>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/decks">
              Manage decks
            </Link>
            <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/cards">
              Manage cards
            </Link>
          </div>
        </section>

        <section className="rounded border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Listening</h2>
          <p className="mt-2 text-sm text-slate-600">
            Listening analytics module is reserved for upcoming milestones. This block keeps the
            dashboard extensible for future content types.
          </p>
          <div className="mt-3 rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
            Metrics: Coming soon
          </div>
        </section>
      </div>

      <section className="mt-4 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Study Algorithm Testing</h2>
        <p className="mt-2 text-sm text-slate-600">
          Test the FSRS spaced repetition algorithm and see predicted next review times.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link className="rounded bg-blue-600 px-3 py-1 text-white" to="/admin/fsrs-test">
            FSRS Algorithm Tester
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">User Management</h2>
        <p className="mt-2 text-sm text-slate-600">Total users: {stats?.totalUsers ?? 0}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/users">
            Users
          </Link>
          <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/audit">
            Audit Logs
          </Link>
        </div>
      </section>
    </section>
  )
}
