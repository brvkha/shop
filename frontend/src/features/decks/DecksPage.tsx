import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDecks } from './useDecks'

export function DecksPage() {
  const { decks, createDeck, deleteDeck } = useDecks()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const onCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      return
    }
    createDeck(name.trim(), description.trim())
    setName('')
    setDescription('')
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Deck Management</h1>
      <form className="mt-4 grid gap-3 rounded border border-slate-200 bg-white p-4 md:grid-cols-3" onSubmit={onCreate}>
        <input
          aria-label="Deck name"
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Deck name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          aria-label="Deck description"
          className="rounded border border-slate-300 px-3 py-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button className="rounded bg-emerald-700 px-3 py-2 text-white" type="submit">
          Create deck
        </button>
      </form>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {decks.map((deck) => (
          <li className="rounded border border-slate-200 bg-white p-4" key={deck.id}>
            <h2 className="font-semibold">{deck.name}</h2>
            <p className="text-sm text-slate-600">{deck.description}</p>
            <button
              className="mt-3 rounded bg-rose-600 px-3 py-1 text-white"
              onClick={() => deleteDeck(deck.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
