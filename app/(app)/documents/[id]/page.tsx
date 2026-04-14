'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clearCache } from '@/lib/cache'

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('eft')
  const [paymentNote, setPaymentNote] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: q }, { data: i }, { data: pay }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('quotes').select('*').eq('id', params.id).single(),
        supabase.from('quote_items').select('*').eq('quote_id', params.id),
        supabase.from('payments').select('*').eq('quote_id', params.id).order('payment_date'),
      ])
      if (p) setProfile(p)
      if (q) {
        setQuote(q)
        if (q.client_id) {
          const { data: c } = await supabase.from('clients').select('*').eq('id', q.client_id).single()
          if (c) setClient(c)
        }
      }
      if (i) setItems(i)
      if (pay) setPayments(pay)
      setLoading(false)
    }
    load()
  }, [params.id])

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const balance = quote ? Number(quote.total) - totalPaid : 0
  const isFullyPaid = balance <= 0

  const handleAddPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return
    setSavingPayment(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: newPayment } = await supabase.from('payments').insert({
      quote_id: params.id, user_id: user.id,
      amount: parseFloat(paymentAmount), payment_date: paymentDate,
      method: paymentMethod, note: paymentNote,
    }).select().single()
    if (newPayment) {
      const updatedPayments = [...payments, newPayment]
      const newTotalPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const newBalance = Number(quote.total) - newTotalPaid
      const newStatus = newBalance <= 0 ? 'paid' : 'unpaid'
      await supabase.from('quotes').update({ amount_paid: newTotalPaid, status: newStatus }).eq('id', params.id)
      setPayments(updatedPayments)
      setQuote({ ...quote, amount_paid: newTotalPaid, status: newStatus })
      setPaymentAmount('')
      setPaymentNote('')
      setShowPaymentForm(false)
      clearCache('documents')
      clearCache('dashboard')
    }
    setSavingPayment(false)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Remove this payment?')) return
    await supabase.from('payments').delete().eq('id', paymentId)
    const updatedPayments = payments.filter(p => p.id !== paymentId)
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const newBalance = Number(quote.total) - newTotalPaid
    const newStatus = newBalance <= 0 ? 'paid' : 'unpaid'
    await supabase.from('quotes').update({ amount_paid: newTotalPaid, status: newStatus }).eq('id', params.id)
    setPayments(updatedPayments)
    setQuote({ ...quote, amount_paid: newTotalPaid, status: newStatus })
    clearCache('documents')
    clearCache('dashboard')
  }

  const handleWhatsApp = () => {
    if (!client?.phone) return
    const rawPhone = client.phone.trim()
    const phone = rawPhone.replace(/[^\d]/g, '')
    const message = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find attached your ${quote.type === 'quote' ? 'quotation' : 'invoice'} ${quote.quote_number} from ${profile?.business_name}.\n\nTotal: ${quote.currency_symbol} ${Number(quote.total).toLocaleString()}${balance > 0 && quote.type === 'invoice' ? `\nBalance due: ${quote.currency_symbol} ${balance.toLocaleString()}` : ''}\n\nThank you for your business.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleConvertToInvoice = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: numberData } = await supabase.rpc('get_next_quote_number', { uid: user.id, doc_type: 'invoice' })
    const invoiceNumber = numberData || `INV-${new Date().getFullYear()}-${Date.now()}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)
    const { data: invoice } = await supabase.from('quotes').insert({
      user_id: user.id, client_id: quote.client_id, quote_number: invoiceNumber,
      type: 'invoice', status: 'unpaid', currency_code: quote.currency_code,
      currency_symbol: quote.currency_symbol, vat_rate: quote.vat_rate,
      subtotal: quote.subtotal, vat_amount: quote.vat_amount, total: quote.total,
      notes: quote.notes, issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0], amount_paid: 0,
    }).select().single()
    if (invoice) {
      await Promise.all([
        supabase.from('quote_items').insert(items.map(item => ({ ...item, id: undefined, quote_id: invoice.id }))),
        supabase.from('quotes').update({ status: 'converted' }).eq('id', quote.id),
      ])
      clearCache('documents')
      clearCache('dashboard')
      router.push(`/documents/${invoice.id}`)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    await supabase.from('quotes').update({ status: newStatus }).eq('id', params.id)
    setQuote({ ...quote, status: newStatus })
    clearCache('dashboard')
    clearCache('documents')
  }

  const handleDuplicate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: numberData } = await supabase.rpc('get_next_quote_number', { uid: user.id, doc_type: quote.type })
    const newNumber = numberData || `${quote.type === 'invoice' ? 'INV' : 'QUO'}-${new Date().getFullYear()}-${Date.now()}`
    const { data: newDoc } = await supabase.from('quotes').insert({
      user_id: user.id, client_id: quote.client_id, quote_number: newNumber,
      type: quote.type, status: 'draft', currency_code: quote.currency_code,
      currency_symbol: quote.currency_symbol, vat_rate: quote.vat_rate,
      subtotal: quote.subtotal, vat_amount: quote.vat_amount, total: quote.total,
      notes: quote.notes, issue_date: new Date().toISOString().split('T')[0],
      expiry_date: quote.expiry_date, due_date: quote.due_date, amount_paid: 0,
    }).select().single()
    if (newDoc) {
      await supabase.from('quote_items').insert(
        items.map(item => ({ ...item, id: undefined, quote_id: newDoc.id }))
      )
      clearCache('dashboard')
      clearCache('documents')
      router.push(`/documents/${newDoc.id}`)
    }
  }

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge-paid', unpaid: 'badge-unpaid', overdue: 'badge-overdue',
      converted: 'badge-converted', sent: 'badge-sent', accepted: 'badge-accepted',
      rejected: 'badge-rejected', draft: 'badge-draft', expired: 'badge-overdue',
    }
    return map[status] || 'badge-draft'
  }

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = {
      eft: 'EFT / Bank transfer', cash: 'Cash', mobile_money: 'Mobile money', other: 'Other'
    }
    return map[method] || method
  }

  if (loading) return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">Document</div>
        <div style={{ width: 34 }}/>
      </div>
      <div className="q-scroll">
        <div className="q-skeleton-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div className="q-skeleton" style={{ width: 140, height: 16, marginBottom: 8 }}/>
              <div className="q-skeleton" style={{ width: 100, height: 12 }}/>
            </div>
            <div className="q-skeleton" style={{ width: 70, height: 26, borderRadius: 20 }}/>
          </div>
          <div className="q-skeleton" style={{ width: '100%', height: 1, marginBottom: 16 }}/>
          <div className="q-skeleton" style={{ width: 120, height: 14, marginBottom: 8 }}/>
          <div className="q-skeleton" style={{ width: 80, height: 12, marginBottom: 16 }}/>
          <div className="q-skeleton" style={{ width: '100%', height: 80 }}/>
        </div>
      </div>
    </div>
  )

  if (!quote) return <div className="q-page"><div className="q-loading">Document not found</div></div>

  const isInvoice = quote.type === 'invoice'
  const isOverdue = isInvoice && quote.due_date && new Date(quote.due_date) < new Date() && !isFullyPaid
  const isExpired = !isInvoice && quote.expiry_date && new Date(quote.expiry_date) < new Date() && quote.status === 'sent'

  const ActionBtn = ({ onClick, icon, label, bg, color }: any) => (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: bg, border: 'none', borderRadius: 12, padding: '10px 8px', cursor: 'pointer', width: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: 700, color, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </button>
  )

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">{quote.quote_number}</div>
        <span className={`q-badge ${isOverdue ? 'badge-overdue' : isExpired ? 'badge-overdue' : getStatusStyle(quote.status)}`}>
          {isOverdue ? 'OVERDUE' : isExpired ? 'EXPIRED' : quote.status.toUpperCase()}
        </span>
      </div>

      <div className="q-scroll" style={{ paddingRight: 72, paddingBottom: 120 }}>
        {showPaymentForm && (
          <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Record payment</div>
            <div style={{ background: 'var(--green-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Balance due</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{quote.currency_symbol} {balance.toLocaleString()}</span>
            </div>
            <div className="q-form-group">
              <label className="q-label">Amount <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="q-input" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} onFocus={e => e.target.select()} placeholder={`Max: ${quote.currency_symbol} ${balance.toLocaleString()}`} min="0"/>
            </div>
            <div className="q-form-group">
              <label className="q-label">Payment date</label>
              <input className="q-input" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}/>
            </div>
            <div className="q-form-group">
              <label className="q-label">Payment method</label>
              <select className="q-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="eft">EFT / Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile money</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="q-form-group">
              <label className="q-label">Note (optional)</label>
              <input className="q-input" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="e.g. 50% deposit"/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowPaymentForm(false)} className="q-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleAddPayment} disabled={savingPayment || !paymentAmount} className="q-btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, var(--green), var(--green-light))' }}>
                {savingPayment ? 'Saving...' : 'Record'}
              </button>
            </div>
          </div>
        )}

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{profile?.business_name}</div>
              {profile?.contact_person && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{profile.contact_person}</div>}
              {profile?.phone && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{profile.phone}</div>}
              {profile?.email && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{profile.email}</div>}
              {profile?.address && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{profile.address}</div>}
              {profile?.registration_number && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Reg: {profile.registration_number}</div>}
              {profile?.vat_registration_number && <div style={{ fontSize: 12, color: 'var(--text3)' }}>VAT Reg: {profile.vat_registration_number}</div>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 20, background: isInvoice ? 'var(--orange-bg)' : 'var(--purple-bg)', color: isInvoice ? 'var(--orange)' : 'var(--purple)', letterSpacing: '0.04em' }}>
              {isInvoice ? 'INVOICE' : 'QUOTATION'}
            </span>
          </div>

          <div className="q-divider"/>

          {client && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bill to</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</div>
              {client.phone && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{client.phone}</div>}
              {client.email && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{client.email}</div>}
              {client.address && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{client.address}</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Issue date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{quote.issue_date}</div>
            </div>
            {isInvoice && quote.due_date && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Payment due</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? 'var(--red)' : 'var(--text)' }}>{quote.due_date}</div>
              </div>
            )}
            {!isInvoice && quote.expiry_date && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Valid until</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isExpired ? 'var(--red)' : 'var(--text)' }}>{quote.expiry_date}</div>
              </div>
            )}
          </div>

          <div className="q-divider"/>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Item', 'Qty', 'Price', 'Total'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '6px 0', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.description}</div>}
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text2)' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text2)' }}>{quote.currency_symbol}{Number(item.unit_price).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--text)' }}>{quote.currency_symbol}{Number(item.line_total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
              <span>Subtotal</span><span>{quote.currency_symbol} {Number(quote.subtotal).toLocaleString()}</span>
            </div>
            {Number(quote.vat_rate) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                <span>VAT ({quote.vat_rate}%)</span><span>{quote.currency_symbol} {Number(quote.vat_amount).toLocaleString()}</span>
              </div>
            )}
            <div className="q-divider" style={{ margin: '10px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              <span>Total</span><span>{quote.currency_symbol} {Number(quote.total).toLocaleString()}</span>
            </div>
            {isInvoice && totalPaid > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--green)', marginTop: 8 }}>
                  <span>Amount paid</span><span>{quote.currency_symbol} {totalPaid.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: balance > 0 ? 'var(--orange)' : 'var(--green)', marginTop: 6, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  <span>{balance > 0 ? 'Balance due' : 'Fully paid'}</span>
                  <span>{quote.currency_symbol} {Math.max(0, balance).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {quote.notes && (
            <>
              <div className="q-divider"/>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{quote.notes}</div>
            </>
          )}
        </div>

        {isInvoice && payments.length > 0 && (
          <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Payment history</div>
            {payments.map((payment, i) => (
              <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{quote.currency_symbol} {Number(payment.amount).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{payment.payment_date} · {getMethodLabel(payment.method)}</div>
                  {payment.note && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{payment.note}</div>}
                </div>
                <button onClick={() => handleDeletePayment(payment.id)} className="q-icon-btn" style={{ background: 'var(--red-bg)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M4.5 3.5V2.5h5v1M5.5 6v4M8.5 6v4M3 3.5l.8 8h6.4l.8-8" stroke="#ff4060" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', right: 10, top: '40%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
        <ActionBtn
          onClick={() => window.open(`/api/pdf?id=${quote.id}`, '_blank')}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2v11M6 9l4 4 4-4" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 15h12" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="PDF"
          bg="var(--purple-bg)"
          color="var(--purple)"
        />
        {client?.phone && (
          <ActionBtn
            onClick={handleWhatsApp}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5A8.5 8.5 0 0118.5 10c0 4.69-3.81 8.5-8.5 8.5a8.44 8.44 0 01-4.25-1.14L1.5 18.5l1.18-3.62A8.44 8.44 0 011.5 10 8.5 8.5 0 0110 1.5z" stroke="#00c27a" strokeWidth="1.5"/><path d="M7 9c.57 1.14 1.71 2.86 4 4" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="WA"
            bg="var(--green-bg)"
            color="var(--green)"
          />
        )}
        <ActionBtn
          onClick={() => router.push(`/documents/${params.id}/edit`)}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          label="Edit"
          bg="var(--orange-bg)"
          color="var(--orange)"
        />
        {isInvoice && !isFullyPaid && (
          <ActionBtn
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#00c27a" strokeWidth="1.5"/><path d="M2 9h16M6 13h2M10 13h2" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="Pay"
            bg={showPaymentForm ? 'var(--green-bg)' : 'var(--white)'}
            color="var(--green)"
          />
        )}
        {!isInvoice && quote.status !== 'converted' && (
          <ActionBtn
            onClick={handleConvertToInvoice}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="Invoice"
            bg="var(--orange-bg)"
            color="var(--orange)"
          />
        )}
        {!isInvoice && quote.status === 'sent' && (
          <ActionBtn
            onClick={() => handleUpdateStatus('accepted')}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="Accept"
            bg="var(--green-bg)"
            color="var(--green)"
          />
        )}
        {!isInvoice && quote.status === 'sent' && (
          <ActionBtn
            onClick={() => handleUpdateStatus('rejected')}
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="#ff4060" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            label="Reject"
            bg="var(--red-bg)"
            color="var(--red)"
          />
        )}
        <ActionBtn
          onClick={handleDuplicate}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="7" y="7" width="10" height="10" rx="2" stroke="#6c47ff" strokeWidth="1.5"/><path d="M13 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Copy"
          bg="var(--purple-bg)"
          color="var(--purple)"
        />
      </div>

      <nav className="q-bottomnav">
        <Link href="/dashboard" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="2" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/></svg>
          <span className="q-nav-label">Dashboard</span>
        </Link>
        <Link href="/documents" className="q-nav-item active">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8M7 11h8M7 15h5" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label" style={{ color: 'var(--purple)' }}>Docs</span>
          <div className="q-nav-dot"/>
        </Link>
        <Link href="/clients" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#a8a5c0" strokeWidth="1.5"/><path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label">Clients</span>
        </Link>
        <Link href="/settings" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3" stroke="#a8a5c0" strokeWidth="1.5"/><path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#a8a5c0" strokeWidth="1.5"/></svg>
          <span className="q-nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  )
}