import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '../../context/AuthContext'
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '../../utils/orderFlow'

export default function OpsOrders() {
  const { supabase, user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ customer_name: '', phone: '', notes: '', pickup_notes: '' })
  const [invoiceByOrder, setInvoiceByOrder] = useState({})

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
    setLoading(false)
    if (qErr) {
      setError(qErr.message)
      return
    }
    setRows(data || [])
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!supabase || !rows.length) {
      setInvoiceByOrder({})
      return
    }
    let cancelled = false
    const ids = rows.map((r) => r.id)
    ;(async () => {
      const { data } = await supabase.from('invoices').select('id, order_id, invoice_number').in('order_id', ids)
      if (cancelled) return
      const map = {}
      for (const inv of data || []) {
        if (!inv.order_id) continue
        if (!map[inv.order_id]) map[inv.order_id] = []
        map[inv.order_id].push(inv)
      }
      setInvoiceByOrder(map)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, rows])

  const createOrder = async (e) => {
    e.preventDefault()
    if (!supabase || !user) return
    setCreating(true)
    setError(null)
    const { error: cErr } = await supabase.from('orders').insert({
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      pickup_notes: form.pickup_notes.trim() || null,
      created_by: user.id,
      status: 'pickup_pending',
    })
    setCreating(false)
    if (cErr) {
      setError(cErr.message)
      return
    }
    setForm({ customer_name: '', phone: '', notes: '', pickup_notes: '' })
    await load()
  }

  const updateStatus = async (id, status) => {
    if (!supabase) return
    setError(null)
    const { error: uErr } = await supabase.from('orders').update({ status }).eq('id', id)
    if (uErr) {
      setError(uErr.message)
      return
    }
    await load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Orders</h1>
      <p className="mt-2 text-slate-600">Create jobs at pickup and move status through the shop. Changes are logged in Supabase.</p>

      {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <form
        onSubmit={createOrder}
        className="mt-8 grid gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:grid-cols-2"
      >
        <h2 className="font-display text-lg font-bold text-ink-900 sm:col-span-2">New order</h2>
        <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
          Customer name
          <input
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
          />
        </label>
        <label className="block text-sm font-semibold text-ink-900">
          Phone
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </label>
        <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
          Notes
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </label>
        <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
          Pickup notes
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            value={form.pickup_notes}
            onChange={(e) => setForm((f) => ({ ...f, pickup_notes: e.target.value }))}
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Saving…' : 'Create order'}
          </button>
        </div>
      </form>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <div>{o.customer_name}</div>
                    {o.phone ? <div className="text-xs text-slate-500">{o.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full max-w-[12rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold sm:text-sm"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dayjs(o.created_at).format('MMM D, HH:mm')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {(invoiceByOrder[o.id] || []).length > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                          {invoiceByOrder[o.id].length} saved
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                      <Link to={`/ops/invoice?orderId=${o.id}`} className="text-xs font-bold text-brand-dark hover:underline">
                        Bill
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
