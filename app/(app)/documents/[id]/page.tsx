'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: q }, { data: i }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('quotes').select('*').eq('id', params.id).single(),
        supabase.from('quote_items').select('*').eq('quote_id', params.id),
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
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleWhatsApp = () => {
    if (!client?.phone) return
    const phone = client.phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find attached your ${quote.type === 'quote' ? 'quotation' : 'invoice'} ${quote.quote_number} from ${profile?.business_name}.\n\nTotal: ${quote.currency_symbol} ${Number(quote.total).toLocaleString()}\n\nThank you for your business.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleConvertToInvoice = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'invoice')
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`
    const { data: invoice } = await supabase.from('quotes').insert({
      user_id: user.id, client_id: quote.client_id, quote_number: invoiceNumber,
      type: 'invoice', status: 'unpaid', currency_code: quote.currency_code,
      currency_symbol: quote.currency_symbol, vat_rate: quote.vat_rate,
      subtotal: quote.subtotal, vat_amount: quote.vat_amount, total: quote.total,
      notes: quote.notes, issue_date: new Date().toISOString().split('T')[0],
    }).select().single()
    if (invoice) {
      await Promise.all([
        supabase.from('quote_items').insert(items.map(item => ({ ...item, id: undefined, quote_id: invoice.id }))),
        supabase.from('quotes').update({ status: 'converted' }).eq('id', quote.id),
      ])
      router.push(`/documents/${invoice.id}`)
    }
  }

  const handleMarkPaid = async () => {
    await supabase.from('quotes').update({ status: 'paid' }).eq('id', quote.id)
    setQuote({ ...quote, status: 'paid' })
  }

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge-paid', unpaid: 'badge-unpaid', overdue: 'badge-overdue',
      converted: 'badge-converted', sent: 'badge-sent', accepted: 'badge-accepted',
      rejected: 'badge-rejected', draft: 'badge-draft',
    }
    return map[status] || 'badge-draft'
  }

  if (loading) return <div className="q-page"><div className="q-loading">Loading...</div></div>
  if (!quote) return <div className="q-page"><div className="q-loading">Document not found</div></div>

  const isInvoice = quote.type === 'invoice'

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">{quote.quote_number}</div>
        <span className={`q-badge ${getStatusStyle(quote.status)}`}>{quote.status.toUpperCase()}</span>
      </div>

      <div className="q-scroll">
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

          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Issue date</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{quote.issue_date}</div>
            </div>
            {quote.expiry_date && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Valid until</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{quote.expiry_date}</div>
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
              <span>Subtotal</span>
              <span>{quote.currency_symbol} {Number(quote.subtotal).toLocaleString()}</span>
            </div>
            {Number(quote.vat_rate) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                <span>VAT ({quote.vat_rate}%)</span>
                <span>{quote.currency_symbol} {Number(quote.vat_amount).toLocaleString()}</span>
              </div>
            )}
            <div className="q-divider" style={{ margin: '10px 0' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
              <span>Total</span>
              <span>{quote.currency_symbol} {Number(quote.total).toLocaleString()}</span>
            </div>
          </div>

          {quote.notes && (
            <>
              <div className="q-divider"/>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{quote.notes}</div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button onClick={() => window.open(`/api/pdf?id=${quote.id}`, '_blank')} className="q-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v10M5 8l4 4 4-4" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M3 14h12" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Download PDF
          </button>

          {client?.phone && (
            <button onClick={handleWhatsApp} className="q-btn-green">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5A7.5 7.5 0 0116.5 9c0 4.14-3.36 7.5-7.5 7.5a7.44 7.44 0 01-3.75-1L1.5 16.5l1.04-3.19A7.44 7.44 0 011.5 9 7.5 7.5 0 019 1.5z" stroke="#fff" strokeWidth="1.5"/>
                <path d="M6.5 7.5c.5 1 1.5 2.5 3.5 3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Share via WhatsApp
            </button>
          )}

          {!isInvoice && quote.status !== 'converted' && (
            <button onClick={handleConvertToInvoice} className="q-btn-primary" style={{ background: 'linear-gradient(135deg, var(--orange), #ff9a5c)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9h12M10 4l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Convert to Invoice
            </button>
          )}

          {isInvoice && quote.status === 'unpaid' && (
            <button onClick={handleMarkPaid} className="q-btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), var(--green-light))' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Mark as Paid
            </button>
          )}
        </div>
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