import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import SpotlightSurface from '../../components/SpotlightSurface'

const allowSignup = import.meta.env.VITE_ALLOW_SIGNUP === 'true'

export default function OpsLogin() {
  const { supabaseConfigured, signInWithEmail, signUpWithEmail, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from && String(location.state.from).startsWith('/ops') ? location.state.from : '/ops'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [mode, setMode] = useState('signin')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (!supabaseConfigured) {
    return (
      <div className="container-max py-16">
        <h1 className="font-display text-2xl font-bold text-ink-900">Ops sign-in unavailable</h1>
        <p className="mt-3 max-w-xl text-slate-600">Configure Supabase env vars, then rebuild.</p>
        <Link to="/" className="mt-6 inline-block font-semibold text-brand-dark hover:underline">
          Home
        </Link>
      </div>
    )
  }

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [loading, user, from, navigate])

  if (user && !loading) return null

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signup' && allowSignup) {
        const { error } = await signUpWithEmail(email, password, fullName)
        if (error) {
          setMessage(error.message)
          return
        }
        setMessage('Check your email to confirm the account, then sign in.')
        setMode('signin')
        return
      }
      const { error } = await signInWithEmail(email, password)
      if (error) {
        setMessage(error.message)
        return
      }
      navigate(from, { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-max py-12 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-dark">Staff</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-ink-900">Sign in to Ops</h1>
        <p className="mt-2 max-w-xl text-slate-600">Pickup, delivery, and internal tracking. Use the account your manager created.</p>
      </motion.div>

      <SpotlightSurface className="card mx-auto mt-8 max-w-md rounded-2xl p-6 sm:p-8">
        <form className="space-y-4" onSubmit={onSubmit}>
          {allowSignup && mode === 'signup' ? (
            <label className="block text-sm font-semibold text-ink-900">
              Full name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-brand/0 transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </label>
          ) : null}
          <label className="block text-sm font-semibold text-ink-900">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-brand/0 transition focus:border-brand focus:ring-2 focus:ring-brand/25"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-900">
            Password
            <input
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-brand/0 transition focus:border-brand focus:ring-2 focus:ring-brand/25"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {message ? <p className="text-sm text-rose-600">{message}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {allowSignup ? (
          <button
            type="button"
            className="mt-4 w-full text-center text-sm font-semibold text-brand-dark hover:underline"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setMessage(null)
            }}
          >
            {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
          </button>
        ) : null}
        <Link to="/" className="mt-6 block text-center text-sm font-semibold text-slate-600 hover:text-ink-900">
          Back to website
        </Link>
      </SpotlightSurface>
    </div>
  )
}
