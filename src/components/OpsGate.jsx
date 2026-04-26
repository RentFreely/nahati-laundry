import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OpsLayout from './OpsLayout'

export default function OpsGate() {
  const { supabaseConfigured, user, loading } = useAuth()
  const location = useLocation()

  if (!supabaseConfigured) {
    return (
      <div className="container-max py-16">
        <h1 className="font-display text-2xl font-bold text-ink-900">Ops unavailable</h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Supabase environment variables are missing. Add <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code>{' '}
          and <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> for this build, then redeploy.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="h-9 w-9 rounded-full border-2 border-brand/40 border-t-brand animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/ops/login" replace state={{ from: location.pathname }} />
  }

  return (
    <OpsLayout>
      <Outlet />
    </OpsLayout>
  )
}
