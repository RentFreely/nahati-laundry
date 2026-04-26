import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { createInvoicePdf, invoiceFileName, generateInvoiceNumber } from '../utils/invoice'
import { submitInvoiceToGoogleForms } from '../utils/googleFormsInvoices'

export default function AdminInvoice() {
  // Customer details
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')

  // Service details
  const [serviceType, setServiceType] = useState('Express Service')
  const [weightKg, setWeightKg] = useState(0)
  const [ratePerKg, setRatePerKg] = useState(8000)
  const [pickupDate, setPickupDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dropoffDate, setDropoffDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Costs
  const [pickupDropoffFee, setPickupDropoffFee] = useState(0)

  // Meta
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber())
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [saving, setSaving] = useState(false)

  // Other Services line items
  const [items, setItems] = useState([{ name: '', amount: 0 }])
  const otherItemsTotal = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.amount || 0), 0),
    [items]
  )

  const laundryAmount = useMemo(
    () => Math.round(Number(weightKg || 0) * Number(ratePerKg || 0)),
    [weightKg, ratePerKg]
  )
  const totalAmount = useMemo(
    () => Math.round(laundryAmount + Number(pickupDropoffFee || 0) + otherItemsTotal),
    [laundryAmount, pickupDropoffFee, otherItemsTotal]
  )

  async function handleGenerate() {
    setSaving(true)
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

      const pdf = await createInvoicePdf({ business, invoice })
      const fileName = invoiceFileName(clientName, invoiceDate)
      pdf.save(fileName)

      // Store to Google Sheets via Invoices form
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container-max py-10">
      <div className="mb-6 rounded-xl border border-brand/25 bg-brand/5 px-4 py-3 text-sm text-slate-700">
        <strong className="text-ink-900">Ops:</strong> to save invoices, income, and order links in Supabase, use{' '}
        <Link className="font-bold text-brand-dark hover:underline" to="/ops/invoice">
          Staff → Invoice
        </Link>
        . This page still downloads PDFs and can submit to Google Forms when configured.
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Invoice</h1>
        <div className="text-sm text-gray-600">Invoice No: <span className="font-mono">{invoiceNumber}</span></div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          <section className="card border border-gray-200">
          <h2 className="font-semibold mb-4">Customer Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="rounded-md border px-3 py-2" placeholder="Name" value={clientName} onChange={e=>setClientName(e.target.value)}/>
            <input className="rounded-md border px-3 py-2" placeholder="Contact phone" value={clientPhone} onChange={e=>setClientPhone(e.target.value)}/>
            <input className="rounded-md border px-3 py-2 sm:col-span-2" placeholder="Pickup Location" value={pickupLocation} onChange={e=>setPickupLocation(e.target.value)}/>
            <input className="rounded-md border px-3 py-2 sm:col-span-2" placeholder="Drop-off Location" value={dropoffLocation} onChange={e=>setDropoffLocation(e.target.value)}/>
          </div>
          </section>

          <section className="card border border-gray-200">
          <h2 className="font-semibold mb-2">Service Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <select className="rounded-md border px-3 py-2" value={serviceType} onChange={e=>setServiceType(e.target.value)}>
              <option>Ordinary Service</option>
              <option>Normal Service</option>
              <option>Express Service</option>
              <option>Other</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" className="rounded-md border px-3 py-2" placeholder="Weight (kgs)" value={weightKg} onChange={e=>setWeightKg(e.target.value)}/>
              <input type="number" step="1" className="rounded-md border px-3 py-2" placeholder="Rate per kg (UGX)" value={ratePerKg} onChange={e=>setRatePerKg(e.target.value)}/>
            </div>
            <input type="date" className="rounded-md border px-3 py-2" value={pickupDate} onChange={e=>setPickupDate(e.target.value)}/>
            <input type="date" className="rounded-md border px-3 py-2" value={dropoffDate} onChange={e=>setDropoffDate(e.target.value)}/>
          </div>
          </section>

          <section className="card border border-gray-200">
            <h2 className="font-semibold mb-2">Other Services</h2>
            <p className="text-sm text-gray-600 mb-3">Add any additional services and their prices (e.g., Sneaker cleaning, Suit, Duvet, Dry Cleaning).</p>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div className="grid grid-cols-12 gap-3" key={idx}>
                  <input className="col-span-7 rounded-md border px-3 py-2" placeholder="Service name" value={it.name} onChange={e=>{
                    const next=[...items]; next[idx] = { ...next[idx], name: e.target.value }; setItems(next)
                  }}/>
                  <input type="number" className="col-span-4 rounded-md border px-3 py-2" placeholder="Amount (UGX)" value={it.amount} onChange={e=>{
                    const next=[...items]; next[idx] = { ...next[idx], amount: e.target.value }; setItems(next)
                  }}/>
                  <button type="button" className="col-span-1 btn-outline" onClick={()=> setItems(prev => prev.length>1 ? prev.filter((_,i)=>i!==idx) : prev)}>–</button>
                </div>
              ))}
              <div>
                <button type="button" className="btn-outline" onClick={()=> setItems(prev => [...prev, { name: '', amount: 0 }])}>+ Add service</button>
              </div>
              <div className="text-sm text-gray-700 flex items-center justify-between"><span>Other services total</span><span className="font-medium">{otherItemsTotal.toLocaleString('en-UG')}</span></div>
            </div>
          </section>

          <section className="card border border-gray-200">
          <h2 className="font-semibold mb-2">Special Instructions</h2>
          <textarea className="w-full rounded-md border px-3 py-2" rows="3" value={specialInstructions} onChange={e=>setSpecialInstructions(e.target.value)} placeholder="Any notes for garment care, detergent or softener preferences, delicate handling, etc."/>
          </section>

          <section className="card border border-gray-200">
          <h2 className="font-semibold mb-2">Cost Summary</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="text-sm text-gray-700 flex items-center justify-between gap-2">Laundry Amount
              <input disabled className="ml-3 w-40 rounded-md border px-3 py-2 bg-gray-50" value={laundryAmount.toLocaleString('en-UG')} />
            </label>
            <label className="text-sm text-gray-700 flex items-center justify-between gap-2">Other services total
              <input disabled className="ml-3 w-40 rounded-md border px-3 py-2 bg-gray-50" value={otherItemsTotal.toLocaleString('en-UG')} />
            </label>
            <label className="text-sm text-gray-700 flex items-center justify-between gap-2">Pick up & drop off fee
              <input type="number" className="ml-3 w-40 rounded-md border px-3 py-2" value={pickupDropoffFee} onChange={e=>setPickupDropoffFee(e.target.value)}/>
            </label>
            <label className="text-sm text-gray-700 flex items-center justify-between gap-2">Total Amount
              <input disabled className="ml-3 w-40 rounded-md border px-3 py-2 bg-gray-50" value={totalAmount.toLocaleString('en-UG')} />
            </label>
          </div>
          </section>

          <section className="card border border-gray-200">
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm text-gray-700 flex items-center gap-2">Invoice Date
              <input type="date" className="ml-auto rounded-md border px-2 py-1" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)}/>
            </label>
            <label className="text-sm text-gray-700 flex items-center gap-2">Invoice No
              <input className="ml-auto rounded-md border px-2 py-1 font-mono" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)}/>
            </label>
            <button className="btn-outline h-9 mt-6" onClick={()=>setInvoiceNumber(generateInvoiceNumber())}>New Number</button>
          </div>
          </section>
        </div>

        <div className="card h-fit border border-gray-200">
          <h2 className="font-semibold mb-4">Actions</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Laundry</span><span>{laundryAmount.toLocaleString('en-UG')}</span></div>
            {otherItemsTotal > 0 && <div className="flex justify-between"><span>Other services</span><span>{otherItemsTotal.toLocaleString('en-UG')}</span></div>}
            <div className="flex justify-between"><span>Pick up & drop off</span><span>{Number(pickupDropoffFee||0).toLocaleString('en-UG')}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{totalAmount.toLocaleString('en-UG')}</span></div>
          </div>
          <button className="btn-primary mt-4 w-full" onClick={handleGenerate} disabled={saving}>
            {saving ? 'Generating…' : 'Download Invoice & Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
