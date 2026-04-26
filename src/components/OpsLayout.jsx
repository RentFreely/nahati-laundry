import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink-900'
  }`

export default function OpsLayout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const canLedger = profile?.role === 'manager' || profile?.role === 'admin'

  return (
    <div className="min-h-[70vh] bg-slate-50/80">
      <div className="border-b border-slate-200/90 bg-white">
        <div className="container-max flex flex-col gap-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <Link to="/ops" className="font-display text-lg font-bold text-ink-900">
              Nahati Ops
            </Link>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/ops" end className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/ops/orders" className={navClass}>
                Orders
              </NavLink>
              {canLedger ? (
                <NavLink to="/ops/ledger" className={navClass}>
                  Ledger
                </NavLink>
              ) : null}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-600">
              <span className="font-medium text-ink-900">{profile?.full_name || 'Staff'}</span>
              <span className="mx-2 text-slate-300">·</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {profile?.role || '…'}
              </span>
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={async () => {
                await signOut()
                navigate('/ops/login', { replace: true })
              }}
            >
              Sign out
            </button>
            <Link to="/" className="font-semibold text-brand-dark hover:underline">
              Public site
            </Link>
          </div>
        </div>
      </div>
      <div className="container-max py-8">{children}</div>
    </div>
  )
}
