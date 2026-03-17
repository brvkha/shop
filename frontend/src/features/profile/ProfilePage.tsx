import { useState } from 'react'
import type { FormEvent } from 'react'

export function ProfilePage() {
  const [dailyLimit, setDailyLimit] = useState(30)
  const [saved, setSaved] = useState(false)

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">Profile Settings</h1>
      <form className="mt-4 rounded border border-slate-200 bg-white p-4" onSubmit={onSave}>
        <label className="block text-sm">Daily learning limit</label>
        <input
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          min={1}
          type="number"
          value={dailyLimit}
          onChange={(event) => setDailyLimit(Number(event.target.value))}
        />
        <button className="mt-3 rounded bg-slate-900 px-3 py-2 text-white" type="submit">
          Save
        </button>
        {saved ? <p className="mt-2 text-sm text-emerald-700">Profile updated.</p> : null}
      </form>
    </section>
  )
}
