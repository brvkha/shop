import { useLearningStore } from '../../../store/learningStore'
import { ConfirmActionDialog } from '../components/ConfirmActionDialog'

export function AdminCardsPage() {
  const cards = useLearningStore((state) => state.cards)
  const updateCard = useLearningStore((state) => state.updateCard)

  if (!cards.length) {
    return <p className="rounded border border-slate-200 bg-white p-4">No card to moderate.</p>
  }

  const candidate = cards[0]

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Card Moderation</h1>
      <div className="mt-4 max-w-md">
        <ConfirmActionDialog
          title={`Normalize card: ${candidate.front}`}
          description="Admin can edit card content to enforce quality standards."
          onConfirm={() => {
            updateCard(
              candidate.id,
              candidate.front.trim(),
              `${candidate.back.trim()} (reviewed by admin)`,
              candidate.tags,
            )
            return `Card ${candidate.front} normalized by admin.`
          }}
        />
      </div>
    </section>
  )
}
