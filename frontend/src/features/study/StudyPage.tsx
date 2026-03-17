import { useMemo, useState } from 'react'
import { useLearningStore } from '../../store/learningStore'
import type { StudyRating } from '../../types'

const ratings: StudyRating[] = ['Again', 'Hard', 'Good', 'Easy']

export function StudyPage() {
  const cards = useLearningStore((state) => state.cards)
  const rateCard = useLearningStore((state) => state.rateCard)
  const dueCards = useMemo(() => cards.filter((card) => card.due), [cards])
  const [revealed, setRevealed] = useState(false)

  const current = dueCards[0]

  const onRate = (rating: StudyRating) => {
    if (!current) {
      return
    }
    rateCard(current.id, rating)
    setRevealed(false)
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Study Session</h1>
      <p className="mt-2 text-sm text-slate-600">Due cards: {dueCards.length}</p>
      {!current ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-4">No due card. Great progress.</p>
      ) : (
        <article className="mt-4 rounded border border-slate-200 bg-white p-5">
          <p className="text-lg font-medium">{current.front}</p>
          {revealed ? <p className="mt-3 text-slate-700">{current.back}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={() => setRevealed(true)}>
              Reveal answer
            </button>
            {ratings.map((rating) => (
              <button
                className="rounded border border-slate-300 px-3 py-2"
                key={rating}
                onClick={() => onRate(rating)}
              >
                {rating}
              </button>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}
