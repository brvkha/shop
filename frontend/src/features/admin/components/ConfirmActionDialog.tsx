import { useState } from 'react'

type ConfirmActionDialogProps = {
  title: string
  description: string
  onConfirm: () => string
}

export function ConfirmActionDialog({ title, description, onConfirm }: ConfirmActionDialogProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const run = () => {
    try {
      const result = onConfirm()
      setError('')
      setMessage(result)
    } catch (reason) {
      setMessage('')
      setError(reason instanceof Error ? reason.message : 'Action failed')
    }
  }

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-slate-600">{description}</p>
      <button className="mt-2 rounded bg-amber-600 px-3 py-1 text-white" onClick={run}>
        Confirm
      </button>
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
