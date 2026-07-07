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

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address first.'); return }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setMessage('Password reset email sent — check your inbox.')
    setLoading(false)
  }

  const inputCls = 'w-full border border-[#d4d4d8] bg-white text-[#18181b] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#18181b] focus:ring-1 focus:ring-[#18181b]'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f4f5]">
      <div
        className="w-full max-w-sm bg-white border border-[#e4e4e7] rounded-2xl p-8"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)' }}
      >
        <h1 className="text-2xl font-bold text-[#09090b] mb-1">memoru</h1>
        <p className="text-sm text-[#52525b] mb-6">your personal network, remembered</p>

        <div className="flex gap-2 mb-6 text-sm">
          <button
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
            className={`px-3 py-1 rounded-full transition-colors ${mode === 'login' ? 'bg-[#09090b] text-white' : 'text-[#52525b] hover:text-[#18181b]'}`}
          >
            Log in
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`px-3 py-1 rounded-full transition-colors ${mode === 'signup' ? 'bg-[#09090b] text-white' : 'text-[#52525b] hover:text-[#18181b]'}`}
          >
            Sign up
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#3f3f46]">Email</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#3f3f46]">Password</label>
              {mode === 'login' && (
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-[#52525b] hover:text-[#18181b] transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs text-green-600">{message}</p>}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-2.5 bg-[#09090b] text-white rounded-lg text-sm font-medium mt-1 disabled:opacity-50 hover:bg-[#18181b] transition-colors"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>

        <p className="text-sm text-center text-[#52525b] mt-6">
          Not sure yet?{' '}
          <a href="/demo" className="text-[#18181b] font-medium underline underline-offset-2 hover:text-[#09090b]">
            Browse the demo
          </a>
        </p>
      </div>
    </div>
  )
}
