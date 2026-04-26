import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAuth } from '../../context/AuthContext'
import { ORDER_STATUS_LABEL } from '../../utils/orderFlow'

dayjs.extend(relativeTime)

export default function OpsDashboard() {
  const { supabase, profile } = useAuth()
  const [counts, setCounts] = useState({ open: 0, delivered: 0 })
  const [recent, setRecent] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (cancelled) return
      if (error) {
        setErr(error.message)
        return
      }
      const list = orders || []
      const open = list.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
      const delivered = list.filter((o) => o.status === 'delivered').length
      setCounts({ open, delivered })
      setRecent(list.slice(0, 8))
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">Signed in as {profile?.full_name}. Use Orders for pickup and delivery updates.</p>

      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Active pipeline</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-ink-900">{counts.open}</p>
          <p className="mt-1 text-sm text-slate-600">Orders not delivered or cancelled (recent sample).</p>
          <Link to="/ops/orders" className="mt-4 inline-block text-sm font-bold text-brand-dark hover:underline">
            Go to orders →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Recently delivered</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-ink-900">{counts.delivered}</p>
          <p className="mt-1 text-sm text-slate-600">In the last 50 orders loaded for this summary.</p>
          {(profile?.role === 'manager' || profile?.role === 'admin') && (
            <Link to="/ops/ledger" className="mt-4 inline-block text-sm font-bold text-brand-dark hover:underline">
              Open ledger →
            </Link>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink-900">Recent orders</h2>
        <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white">
          {recent.length === 0 ? (
            <li className="px-4 py-6 text-sm text-slate-600">No orders yet. Create one under Orders.</li>
          ) : (
            recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-semibold text-ink-900">{o.customer_name}</span>
                <span className="text-slate-600">{ORDER_STATUS_LABEL[o.status] || o.status}</span>
                <span className="text-xs text-slate-400">{dayjs(o.created_at).fromNow()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
