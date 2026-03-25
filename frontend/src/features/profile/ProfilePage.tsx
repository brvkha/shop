import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  getAlgorithmWeights,
  resetAlgorithmWeights,
  updateAlgorithmWeights,
} from '../../services/studySettingsApi'
import { useAuthStore } from '../../store/authStore'

type SettingsTab = 'general' | 'algorithm'
const REQUIRED_FSRS_WEIGHT_COUNT = 19
const DEFAULT_FSRS_WEIGHTS = [
  1.2682, 1.2682, 6.4994, 16.1563,
  6.9135, 0.6470, 2.5935, 0.0010,
  1.7036, 0.1711, 1.1668, 2.0287,
  0.0767, 0.4215, 2.5117, 0.2713,
  3.6253, 0.4372, 0.0468,
]

function normalizeWeights(rawWeights: number[]): string[] {
  const normalized = Array.from({ length: REQUIRED_FSRS_WEIGHT_COUNT }, (_, index) => {
    const rawValue = rawWeights[index]
    if (Number.isFinite(rawValue)) {
      return rawValue.toString()
    }
    return DEFAULT_FSRS_WEIGHTS[index].toString()
  })
  return normalized
}

export function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const canManageAlgorithm = currentUser?.role === 'ADMIN'
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [dailyLimit, setDailyLimit] = useState(30)
  const [generalSaved, setGeneralSaved] = useState(false)
  const [weights, setWeights] = useState<string[]>(normalizeWeights(DEFAULT_FSRS_WEIGHTS))
  const [weightLoading, setWeightLoading] = useState(false)
  const [weightSaving, setWeightSaving] = useState(false)
  const [weightError, setWeightError] = useState('')
  const [weightSaved, setWeightSaved] = useState(false)

  useEffect(() => {
    if (!canManageAlgorithm && activeTab === 'algorithm') {
      setActiveTab('general')
      return
    }

    if (activeTab !== 'algorithm') {
      return
    }

    setWeightLoading(true)
    setWeightError('')
    void getAlgorithmWeights()
      .then((response) => {
        setWeights(normalizeWeights(response.weights))
      })
      .catch((err) => {
        setWeightError(err instanceof Error ? err.message : 'Failed to load weights')
      })
      .finally(() => {
        setWeightLoading(false)
      })
  }, [activeTab, canManageAlgorithm, weights.length])

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setGeneralSaved(true)
  }

  const onSaveWeights = async () => {
    if (weights.length !== REQUIRED_FSRS_WEIGHT_COUNT) {
      setWeightError(`FSRS v6 requires exactly ${REQUIRED_FSRS_WEIGHT_COUNT} weights`)
      return
    }

    const parsed = weights.map((value) => Number(value))
    if (parsed.some((value) => Number.isNaN(value))) {
      setWeightError('Please enter valid numbers for all weights')
      return
    }

    setWeightSaving(true)
    setWeightError('')
    try {
      const response = await updateAlgorithmWeights(parsed)
      setWeights(normalizeWeights(response.weights))
      setWeightSaved(true)
      window.setTimeout(() => setWeightSaved(false), 2500)
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Failed to save weights')
    } finally {
      setWeightSaving(false)
    }
  }

  const onResetWeights = async () => {
    setWeightSaving(true)
    setWeightError('')
    try {
      const response = await resetAlgorithmWeights()
      setWeights(normalizeWeights(response.weights))
      setWeightSaved(true)
      window.setTimeout(() => setWeightSaved(false), 2500)
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Failed to reset weights')
    } finally {
      setWeightSaving(false)
    }
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-4 flex gap-2">
        <button
          className={`rounded px-3 py-2 text-sm ${
            activeTab === 'general' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white'
          }`}
          onClick={() => setActiveTab('general')}
          type="button"
        >
          General
        </button>
        {canManageAlgorithm ? (
          <button
            className={`rounded px-3 py-2 text-sm ${
              activeTab === 'algorithm' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white'
            }`}
            onClick={() => setActiveTab('algorithm')}
            type="button"
          >
            Algorithm Weights
          </button>
        ) : null}
      </div>

      {activeTab === 'general' ? (
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
          {generalSaved ? <p className="mt-2 text-sm text-emerald-700">Profile updated.</p> : null}
        </form>
      ) : (
        <div className="mt-4 rounded border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Tune FSRS weights used by scheduling. Changes apply immediately on this backend runtime.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            FSRS v6 requires exactly {REQUIRED_FSRS_WEIGHT_COUNT} parameters.
          </p>

          {weightLoading ? <p className="mt-3 text-sm text-slate-500">Loading weights...</p> : null}
          {weightError ? <p className="mt-3 text-sm text-rose-600">{weightError}</p> : null}

          {weights.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {weights.map((value, index) => (
                <label className="text-sm" key={`weight-${index}`}>
                  <span>W{index}</span>
                  <input
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(event) => {
                      setWeights((prev) => prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
              disabled={weightLoading || weightSaving || weights.length === 0}
              onClick={() => void onSaveWeights()}
              type="button"
            >
              {weightSaving ? 'Saving...' : 'Save Weights'}
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-2 disabled:opacity-50"
              disabled={weightLoading || weightSaving}
              onClick={() => void onResetWeights()}
              type="button"
            >
              Reset Default
            </button>
          </div>

          {weightSaved ? <p className="mt-2 text-sm text-emerald-700">Weights updated.</p> : null}
        </div>
      )}
    </section>
  )
}
