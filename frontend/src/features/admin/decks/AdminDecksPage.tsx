import { useLearningStore } from '../../../store/learningStore'
import { ConfirmActionDialog } from '../components/ConfirmActionDialog'

export function AdminDecksPage() {
  const decks = useLearningStore((state) => state.decks)
  const deleteDeck = useLearningStore((state) => state.deleteDeck)

  if (!decks.length) {
    return <p className="rounded border border-slate-200 bg-white p-4">No deck to moderate.</p>
  }

  const candidate = decks[0]

  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Deck Moderation</h1>
      <div className="mt-4 max-w-md">
        <ConfirmActionDialog
          title={`Delete deck: ${candidate.name}`}
          description="Admin can remove any user deck in one action."
          onConfirm={() => {
            deleteDeck(candidate.id)
            return `Deck ${candidate.name} deleted by admin.`
          }}
        />
      </div>
    </section>
  )
}
