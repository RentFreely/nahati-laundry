import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '../../context/AuthContext'
import { EXPENSE_ENTRY_CODES, INCOME_ENTRY_CODES, labelForEntryCode } from '../../utils/ledgerCodes'

function categoryLabelForForm(entryType, entryCode, customLabel) {
  if (entryType === 'expense') {
    if (entryCode === 'exp.other') return (customLabel || '').trim() || 'Other expense'
    return EXPENSE_ENTRY_CODES.find((e) => e.code === entryCode)?.label || 'Expense'
  }
  if (entryCode === 'inc.other') return (customLabel || '').trim() || 'Other income'
  return INCOME_ENTRY_CODES.find((e) => e.code === entryCode)?.label || 'Income'
}

export default function OpsLedger() {
  const { supabase, user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    entry_type: 'expense',
    amount_ugx: '',
    entry_code: 'exp.water',
    custom_label: '',
    description: '',
  })

  const codeOptions = useMemo(
    () => (form.entry_type === 'expense' ? EXPENSE_ENTRY_CODES : INCOME_ENTRY_CODES),
    [form.entry_type],
  )

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase.from('ledger_entries').select('*').order('created_at', { ascending: false }).limit(300)
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
    setForm((f) => ({
      ...f,
      entry_code: (f.entry_type === 'expense' ? EXPENSE_ENTRY_CODES : INCOME_ENTRY_CODES)[0].code,
      custom_label: '',
    }))
  }, [form.entry_type])

  const submit = async (e) => {
    e.preventDefault()
    if (!supabase || !user) return
    const amt = Number(form.amount_ugx)
    if (!Number.isFinite(amt) || amt < 0) {
      setError('Enter a valid amount')
      return
    }
    const needsCustom =
      (form.entry_type === 'expense' && form.entry_code === 'exp.other') ||
      (form.entry_type === 'income' && form.entry_code === 'inc.other')
    if (needsCustom && !form.custom_label.trim()) {
      setError('Enter a label for “Other”.')
      return
    }
    const category = categoryLabelForForm(form.entry_type, form.entry_code, form.custom_label)
    setSaving(true)
    setError(null)
    const { error: cErr } = await supabase.from('ledger_entries').insert({
      entry_type: form.entry_type,
      entry_code: form.entry_code,
      amount_ugx: amt,
      category,
      description: form.description.trim() || null,
      created_by: user.id,
    })
    setSaving(false)
    if (cErr) {
      setError(cErr.message)
      return
    }
    setForm({
      entry_type: 'expense',
      amount_ugx: '',
      entry_code: 'exp.water',
      custom_label: '',
      description: '',
    })
    await load()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-900">Finance &amp; expenses</h1>
      <p className="mt-2 text-slate-600">
        Structured buckets for common shop costs, plus “Other”. Only managers and admins can view and post here (staff record income from{' '}
        <Link className="font-semibold text-brand-dark hover:underline" to="/ops/invoice">
          Invoice
        </Link>
        ).
      </p>

      {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:grid-cols-2">
        <h2 className="font-display text-lg font-bold text-ink-900 sm:col-span-2">New entry</h2>
        <label className="block text-sm font-semibold text-ink-900">
          Type
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            value={form.entry_type}
            onChange={(e) => setForm((f) => ({ ...f, entry_type: e.target.value }))}
          >
            <option value="expense">Expense</option>
            <option value="income">Income (manual)</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink-900">
          Category
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            value={form.entry_code}
            onChange={(e) => setForm((f) => ({ ...f, entry_code: e.target.value }))}
          >
            {codeOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {(form.entry_code === 'exp.other' || form.entry_code === 'inc.other') && (
          <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
            Other — describe
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
              value={form.custom_label}
              onChange={(e) => setForm((f) => ({ ...f, custom_label: e.target.value }))}
              placeholder="e.g. repairs, bags, bank charges"
            />
          </label>
        )}
        <label className="block text-sm font-semibold text-ink-900">
          Amount (UGX)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
            value={form.amount_ugx}
            onChange={(e) => setForm((f) => ({ ...f, amount_ugx: e.target.value }))}
          />
        </label>
        <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
          Notes (optional)
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </form>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Bucket</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No entries yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dayjs(r.created_at).format('MMM D, YYYY HH:mm')}</td>
                  <td className="px-4 py-3 capitalize">{r.entry_type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{labelForEntryCode(r.entry_code)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{r.category}</div>
                    {r.description ? <div className="text-xs text-slate-500">{r.description}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink-900">{Number(r.amount_ugx).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
