import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireManager({ children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-9 w-9 rounded-full border-2 border-brand/40 border-t-brand animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (profile?.role !== 'manager' && profile?.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-6 text-amber-950">
        <h2 className="font-display text-lg font-bold">Managers only</h2>
        <p className="mt-2 text-sm text-amber-900/90">Ask a manager or admin to grant access to the ledger.</p>
        <Link to="/ops" className="mt-4 inline-block font-semibold text-brand-dark hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  return children
}
