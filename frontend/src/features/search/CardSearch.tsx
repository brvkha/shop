import type { Card } from '../../types'

type CardSearchProps = {
  cards: Card[]
  query: string
}

export function CardSearch({ cards, query }: CardSearchProps) {
  const lowered = query.trim().toLowerCase()
  const filtered = lowered
    ? cards.filter((card) => {
        const haystack = `${card.front} ${card.back} ${card.tags.join(' ')}`.toLowerCase()
        return haystack.includes(lowered)
      })
    : cards

  return (
    <div className="mt-3">
      <p className="text-sm text-slate-600">Results: {filtered.length}</p>
      <ul className="mt-2 space-y-2">
        {filtered.map((card) => (
          <li className="rounded border border-slate-200 bg-white p-3" key={card.id}>
            <p className="font-medium">{card.front}</p>
            <p className="text-sm text-slate-600">{card.back}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
