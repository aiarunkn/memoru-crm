'use client'

import { useState } from 'react'
import type { createClient } from '../lib/supabase'

type Props = { supabase: ReturnType<typeof createClient> }

export default function AuthScreen({ supabase }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth() {
    setError('')
    setMessage('')
    setLoading(true)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">memoru</h1>
        <p className="text-sm text-gray-400 mb-6">your personal network, remembered</p>
        <div className="flex gap-2 mb-6 text-sm">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`px-3 py-1 rounded-full ${mode === 'login' ? 'bg-black text-white' : 'text-gray-500'}`}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`px-3 py-1 rounded-full ${mode === 'signup' ? 'bg-black text-white' : 'text-gray-500'}`}
          >
            Sign up
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            className="border rounded-lg px-3 py-2 text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded-lg px-3 py-2 text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}
          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-lg text-sm mt-1 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-6">
          Not sure yet?{' '}
          <a href="/demo" className="underline underline-offset-2 hover:text-gray-600">Browse the demo</a>
        </p>
      </div>
    </div>
  )
}
