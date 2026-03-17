import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

type MediaUploadProps = {
  onUploadSuccess: (url: string) => void
}

const maxMb = Number(import.meta.env.VITE_MEDIA_MAX_MB ?? 5)

export function MediaUpload({ onUploadSuccess }: MediaUploadProps) {
  const [error, setError] = useState('')
  const maxBytes = useMemo(() => maxMb * 1024 * 1024, [])

  const onSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (file.size > maxBytes) {
      setError(`File is larger than ${maxMb}MB`)
      return
    }
    setError('')
    onUploadSuccess(`mock://upload/${file.name}`)
  }

  return (
    <div className="rounded border border-slate-200 p-3">
      <label className="text-sm font-medium">Attach media (max {maxMb}MB)</label>
      <input className="mt-2 block" onChange={onSelect} type="file" />
      {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
