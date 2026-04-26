import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAuth } from '../../context/AuthContext'
import { ORDER_STATUS_LABEL } from '../../utils/orderFlow'

dayjs.extend(relativeTime)

export default function OpsDashboard() {
  const { supabase, profile } = useAuth()
  const [counts, setCounts] = useState({ open: 0, delivered: 0, invoices: 0 })
  const [recent, setRecent] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const [{ data: orders, error: oErr }, { data: invs, error: iErr }, { count: invCount, error: cErr }] = await Promise.all([
        supabase.from('orders').select('id, customer_name, status, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('invoices').select('id, invoice_number, customer_name, total_ugx, created_at').order('created_at', { ascending: false }).limit(6),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
      ])
      if (cancelled) return
      if (oErr) {
        setErr(oErr.message)
        return
      }
      if (iErr) console.warn('[ops dashboard] invoices list', iErr.message)
      if (cErr) console.warn('[ops dashboard] invoices count', cErr.message)
      const list = orders || []
      const open = list.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length
      const delivered = list.filter((o) => o.status === 'delivered').length
      const invList = invs || []
      setCounts({ open, delivered, invoices: typeof invCount === 'number' ? invCount : invList.length })
      setRecent(list.slice(0, 8))
      setRecentInvoices(invList)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">
        Signed in as {profile?.full_name}
        {profile?.job_title ? ` · ${profile.job_title}` : ''}. Track orders, bill customers, and (for managers) review finance.
      </p>

      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
          <Link to="/ops/invoice" className="mt-4 inline-block text-sm font-bold text-brand-dark hover:underline">
            New invoice →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Recent invoices</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-ink-900">{counts.invoices}</p>
          <p className="mt-1 text-sm text-slate-600">Total invoices stored in Supabase.</p>
          {(profile?.role === 'manager' || profile?.role === 'admin') && (
            <Link to="/ops/ledger" className="mt-4 inline-block text-sm font-bold text-brand-dark hover:underline">
              Open finance →
            </Link>
          )}
        </div>
      </div>

      {recentInvoices.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink-900">Latest invoices</h2>
          <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white">
            {recentInvoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-mono text-xs font-semibold text-slate-600">{inv.invoice_number}</span>
                <span className="font-medium text-ink-900">{inv.customer_name}</span>
                <span className="text-slate-600">UGX {Number(inv.total_ugx).toLocaleString('en-UG')}</span>
                <span className="text-xs text-slate-400">{dayjs(inv.created_at).fromNow()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
