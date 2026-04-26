import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { createInvoicePdf, invoiceFileName, generateInvoiceNumber } from '../../utils/invoice'
import { submitInvoiceToGoogleForms } from '../../utils/googleFormsInvoices'
import { useAuth } from '../../context/AuthContext'
import SpotlightSurface from '../../components/SpotlightSurface'

const ORDER_STATUS_AFTER = [
  { value: '', label: 'Do not change order status' },
  { value: 'ready', label: 'Mark order: Ready' },
  { value: 'delivered', label: 'Mark order: Delivered' },
  { value: 'out_for_delivery', label: 'Mark order: Out for delivery' },
]

export default function OpsInvoice() {
  const { supabase, user } = useAuth()
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('orderId')

  const [orders, setOrders] = useState([])
  const [linkedOrderId, setLinkedOrderId] = useState(orderIdParam || '')
  const [afterOrderStatus, setAfterOrderStatus] = useState('')
  const [recordIncome, setRecordIncome] = useState(true)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')

  const [serviceType, setServiceType] = useState('Express Service')
  const [weightKg, setWeightKg] = useState(0)
  const [ratePerKg, setRatePerKg] = useState(8000)
  const [pickupDate, setPickupDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dropoffDate, setDropoffDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [specialInstructions, setSpecialInstructions] = useState('')

  const [pickupDropoffFee, setPickupDropoffFee] = useState(0)
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber())
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [items, setItems] = useState([{ name: '', amount: 0 }])

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const loadOrders = useCallback(async () => {
    if (!supabase) return
    const { data, error: qErr } = await supabase
      .from('orders')
      .select('id, customer_name, phone, status, pickup_notes, delivery_notes, notes')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(80)
    if (qErr) return
    setOrders(data || [])
  }, [supabase])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (!linkedOrderId || !orders.length) return
    const o = orders.find((x) => x.id === linkedOrderId)
    if (!o) return
    setClientName(o.customer_name || '')
    setClientPhone(o.phone || '')
    setPickupLocation(o.pickup_notes || '')
    setDropoffLocation(o.delivery_notes || '')
    if (o.notes) setSpecialInstructions((prev) => (prev ? prev : o.notes))
  }, [linkedOrderId, orders])

  const otherItemsTotal = useMemo(() => items.reduce((sum, it) => sum + Number(it.amount || 0), 0), [items])
  const laundryAmount = useMemo(() => Math.round(Number(weightKg || 0) * Number(ratePerKg || 0)), [weightKg, ratePerKg])
  const totalAmount = useMemo(
    () => Math.round(laundryAmount + Number(pickupDropoffFee || 0) + otherItemsTotal),
    [laundryAmount, pickupDropoffFee, otherItemsTotal],
  )

  const handleGenerate = async () => {
    if (!supabase || !user) return
    setSaving(true)
    setErr(null)
    setMsg(null)
    try {
      const business = {
        name: 'Nahati Anytime Laundry',
        tagline: 'Your Anytime Laundry',
        phone: '+256 200 981 445',
        address: 'Kampala, Uganda',
      }

      const invoice = {
        number: invoiceNumber,
        date: invoiceDate,
        clientName,
        clientPhone,
        pickupLocation,
        dropoffLocation,
        serviceType,
        weightKg,
        ratePerKg,
        pickupDate,
        dropoffDate,
        specialInstructions,
        laundryAmount,
        pickupDropoffFee,
        items,
        otherItemsTotal,
        totalAmount,
      }

      const snapshot = {
        ...invoice,
        linkedOrderId: linkedOrderId || null,
        createdWith: 'nahati-ops',
      }

      const pdf = await createInvoicePdf({ business, invoice })
      const fileName = invoiceFileName(clientName, invoiceDate)
      pdf.save(fileName)

      const { error: invErr } = await supabase.from('invoices').insert({
        order_id: linkedOrderId || null,
        created_by: user.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        customer_name: clientName.trim(),
        customer_phone: clientPhone.trim() || null,
        total_ugx: totalAmount,
        snapshot,
      })
      if (invErr) throw invErr

      if (recordIncome && totalAmount > 0) {
        const { error: ledErr } = await supabase.from('ledger_entries').insert({
          entry_type: 'income',
          entry_code: 'inc.service',
          amount_ugx: totalAmount,
          category: 'Laundry / service (invoice)',
          description: `Invoice ${invoiceNumber}${linkedOrderId ? ` · order ${linkedOrderId.slice(0, 8)}…` : ''}`,
          order_id: linkedOrderId || null,
          created_by: user.id,
        })
        if (ledErr) throw ledErr
      }

      if (linkedOrderId && afterOrderStatus) {
        const { error: ordErr } = await supabase.from('orders').update({ status: afterOrderStatus }).eq('id', linkedOrderId)
        if (ordErr) throw ordErr
      }

      void submitInvoiceToGoogleForms({
        number: invoiceNumber,
        date: invoiceDate,
        createdAtISO: new Date().toISOString(),
        pdfFileName: fileName,
        clientName,
        clientPhone,
        clientAddress: `${pickupLocation}${dropoffLocation ? ' / ' + dropoffLocation : ''}`,
        serviceType,
        weightKg,
        ratePerKg,
        pickupDate,
        dropoffDate,
        specialInstructions,
        laundryAmount,
        pickupDropoffFee,
        totalAmount,
        items,
        subtotal: laundryAmount + otherItemsTotal,
        discount: 0,
        tax: 0,
        total: totalAmount,
        notes: specialInstructions,
      })

      setMsg('Invoice saved to Supabase, PDF downloaded, and income recorded (if enabled).')
      setInvoiceNumber(generateInvoiceNumber())
      await loadOrders()
    } catch (e) {
      setErr(e?.message || String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">Invoice</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Build a PDF receipt, store a full copy in Supabase, optionally record income in the ledger, and link to an open order.
          </p>
        </div>
        <Link to="/ops/orders" className="text-sm font-bold text-brand-dark hover:underline">
          ← Orders
        </Link>
      </div>

      {err ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{err}</p> : null}
      {msg ? <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</p> : null}

      <SpotlightSurface className="card mt-6 rounded-2xl border border-slate-200/90 p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink-900">Link to order (optional)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink-900 sm:col-span-2">
            Open order
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
              value={linkedOrderId}
              onChange={(e) => setLinkedOrderId(e.target.value)}
            >
              <option value="">— None —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.customer_name} · {o.status} · {o.phone || 'no phone'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink-900">
            After saving, set order status
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
              value={afterOrderStatus}
              onChange={(e) => setAfterOrderStatus(e.target.value)}
            >
              {ORDER_STATUS_AFTER.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 pt-6 text-sm font-semibold text-ink-900 sm:pt-8">
            <input type="checkbox" checked={recordIncome} onChange={(e) => setRecordIncome(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Record matching income in ledger
          </label>
        </div>
      </SpotlightSurface>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SpotlightSurface className="card rounded-2xl border border-slate-200/90 p-5">
            <h2 className="font-display font-bold text-ink-900">Customer</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              <input className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 sm:col-span-2"
                placeholder="Pickup location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
              <input
                className="rounded-xl border border-slate-200 px-3 py-2.5 sm:col-span-2"
                placeholder="Drop-off location"
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
              />
            </div>
          </SpotlightSurface>

          <SpotlightSurface className="card rounded-2xl border border-slate-200/90 p-5">
            <h2 className="font-display font-bold text-ink-900">Service</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <select className="rounded-xl border border-slate-200 px-3 py-2.5" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option>Ordinary Service</option>
                <option>Normal Service</option>
                <option>Express Service</option>
                <option>Other</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Weight (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                <input type="number" step="1" className="rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Rate/kg (UGX)" value={ratePerKg} onChange={(e) => setRatePerKg(e.target.value)} />
              </div>
              <input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              <input type="date" className="rounded-xl border border-slate-200 px-3 py-2.5" value={dropoffDate} onChange={(e) => setDropoffDate(e.target.value)} />
            </div>
          </SpotlightSurface>

          <SpotlightSurface className="card rounded-2xl border border-slate-200/90 p-5">
            <h2 className="font-display font-bold text-ink-900">Other line items</h2>
            <p className="mt-1 text-sm text-slate-600">Sneakers, suits, duvets, dry cleaning, etc.</p>
            <div className="mt-4 space-y-3">
              {items.map((it, idx) => (
                <div className="grid grid-cols-12 gap-2" key={idx}>
                  <input
                    className="col-span-7 rounded-xl border border-slate-200 px-3 py-2.5"
                    placeholder="Description"
                    value={it.name}
                    onChange={(e) => {
                      const next = [...items]
                      next[idx] = { ...next[idx], name: e.target.value }
                      setItems(next)
                    }}
                  />
                  <input
                    type="number"
                    className="col-span-4 rounded-xl border border-slate-200 px-3 py-2.5"
                    placeholder="UGX"
                    value={it.amount}
                    onChange={(e) => {
                      const next = [...items]
                      next[idx] = { ...next[idx], amount: e.target.value }
                      setItems(next)
                    }}
                  />
                  <button
                    type="button"
                    className="col-span-1 rounded-xl border border-slate-200 text-lg font-bold text-slate-600 hover:bg-slate-50"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                  >
                    –
                  </button>
                </div>
              ))}
              <button type="button" className="btn-outline text-sm" onClick={() => setItems((prev) => [...prev, { name: '', amount: 0 }])}>
                + Add line
              </button>
            </div>
          </SpotlightSurface>

          <SpotlightSurface className="card rounded-2xl border border-slate-200/90 p-5">
            <h2 className="font-display font-bold text-ink-900">Notes</h2>
            <textarea className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5" rows={3} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
          </SpotlightSurface>

          <SpotlightSurface className="card rounded-2xl border border-slate-200/90 p-5">
            <h2 className="font-display font-bold text-ink-900">Invoice meta</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-semibold text-ink-900">
                Date
                <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </label>
              <label className="text-sm font-semibold text-ink-900 sm:col-span-2">
                Invoice number
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </label>
              <button type="button" className="btn-outline h-10 self-end text-sm" onClick={() => setInvoiceNumber(generateInvoiceNumber())}>
                New number
              </button>
            </div>
          </SpotlightSurface>
        </div>

        <SpotlightSurface className="card h-fit rounded-2xl border border-slate-200/90 p-5 lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-ink-900">Totals</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Laundry</span>
              <span className="font-semibold text-ink-900">{laundryAmount.toLocaleString('en-UG')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Other lines</span>
              <span className="font-semibold text-ink-900">{otherItemsTotal.toLocaleString('en-UG')}</span>
            </div>
            <label className="flex justify-between gap-3 text-slate-600">
              <span className="shrink-0 pt-2">Pickup & drop-off</span>
              <input type="number" className="w-32 rounded-xl border border-slate-200 px-2 py-2 text-right" value={pickupDropoffFee} onChange={(e) => setPickupDropoffFee(e.target.value)} />
            </label>
            <div className="border-t border-slate-100 pt-3 text-base font-bold text-ink-900">
              <div className="flex justify-between">
                <span>Total UGX</span>
                <span>{totalAmount.toLocaleString('en-UG')}</span>
              </div>
            </div>
          </div>
          <button type="button" className="btn-primary mt-6 w-full py-3" onClick={handleGenerate} disabled={saving || !clientName.trim()}>
            {saving ? 'Working…' : 'Save, record income & download PDF'}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            The full line-item breakdown is stored in <span className="font-mono">invoices.snapshot</span> for audits. Google Forms still receives a copy if configured.
          </p>
        </SpotlightSurface>
      </div>
    </div>
  )
}
