import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function LoginPage() {
  const [email, setEmail] = useState('user@khaleo.app')
  const [password, setPassword] = useState('')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email || !password) {
      return
    }
    login(email)
    navigate('/')
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-slate-600">Use an email containing admin to enter as admin.</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="rounded bg-slate-900 px-4 py-2 text-white" type="submit">
          Sign in
        </button>
      </form>
    </section>
  )
}
