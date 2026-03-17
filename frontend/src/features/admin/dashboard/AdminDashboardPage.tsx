import { useLearningStore } from '../../../store/learningStore'
import { Link } from 'react-router-dom'

export function AdminDashboardPage() {
  const decks = useLearningStore((state) => state.decks)
  const cards = useLearningStore((state) => state.cards)
  const dueCards = cards.filter((card) => card.due).length

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total decks</p>
          <p className="text-2xl font-semibold">{decks.length}</p>
        </article>
        <article className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total cards</p>
          <p className="text-2xl font-semibold">{cards.length}</p>
        </article>
        <article className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Due cards (24h proxy)</p>
          <p className="text-2xl font-semibold">{dueCards}</p>
        </article>
      </div>
      <div className="mt-4 rounded border border-slate-200 bg-white p-4">
        <p className="font-medium">Moderation shortcuts</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/users">
            Users
          </Link>
          <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/decks">
            Decks
          </Link>
          <Link className="rounded bg-slate-900 px-3 py-1 text-white" to="/admin/cards">
            Cards
          </Link>
        </div>
      </div>
    </section>
  )
}
