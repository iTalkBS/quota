'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmed, setShowConfirmed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('confirmed') === '1') {
        setShowConfirmed(true)
        setTimeout(() => setShowConfirmed(false), 4000)
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const cached = getCached('dashboard')
      if (cached) {
        setQuotes(cached.quotes || [])
        setClients(cached.clients || [])
        setProfile(cached.profile)
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: q }, { data: c }, { data: p }] = await Promise.all([
        supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      if (q) setQuotes(q)
      if (c) setClients(c)
      if (p) setProfile(p)
      setCached('dashboard', { quotes: q || [], clients: c || [], profile: p })
      setLoading(false)
    }
    loadData()
  }, [])

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown client'

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge-paid', unpaid: 'badge-unpaid', overdue: 'badge-overdue',
      converted: 'badge-converted', sent: 'badge-sent', accepted: 'badge-accepted',
      rejected: 'badge-rejected', draft: 'badge-draft', partial: 'badge-partial',
    }
    return map[status] || 'badge-draft'
  }

  const allQuotes = quotes.filter(q => q.type === 'quote')
  const allInvoices = quotes.filter(q => q.type === 'invoice')
  const unpaidInvoices = allInvoices.filter(q => q.status === 'unpaid' || q.status === 'overdue' || q.status === 'partial')
  const unpaidTotal = unpaidInvoices.reduce((sum, q) => sum + Number(q.total) - Number(q.amount_paid || 0), 0)
  const unpaidSymbol = unpaidInvoices[0]?.currency_symbol || profile?.currency_symbol || ''
  const paidInvoices = allInvoices.filter(q => q.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, q) => sum + Number(q.total), 0)
  const recent = quotes.slice(0, 5)
  const isNewUser = !loading && profile !== null && !profile?.business_name

  return (
    <div className="q-page">
      <div className="q-header-gradient" style={{ paddingTop: 56 }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Qouta</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
            {profile?.business_name || 'Welcome back'}
          </div>
        </div>
      </div>

      <div className="q-scroll" style={{ paddingTop: 24 }}>
        {showConfirmed && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,194,122,0.3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#00c27a" strokeWidth="1.5"/><path d="M6 10l3 3 5-5" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>Email confirmed</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Welcome to Qouta. Your account is ready.</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="q-loading">Loading...</div>
        ) : isNewUser ? (
          <div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Welcome to Qouta</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.6 }}>
                Create your first quote in seconds. Add your client, list your items, and share a professional PDF via WhatsApp.
              </div>
              <Link href="/documents/new" className="q-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                Create your first quote
              </Link>
            </div>
            <div style={{ background: 'var(--purple-bg)', border: '1px solid rgba(108,71,255,0.2)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', marginBottom: 8 }}>Getting started checklist</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 2 }}>
                <div>① Go to Settings → fill in your business profile</div>
                <div>② Add your banking details for PDF invoices</div>
                <div>③ Add items to your directory for quick quoting</div>
                <div>④ Create your first quote and share via WhatsApp</div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="q-stat-grid">
              <div className="q-stat">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Quotes sent</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>{allQuotes.length}</div>
                <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, marginTop: 3 }}>{allInvoices.length} invoice{allInvoices.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="q-stat">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Outstanding</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>{unpaidInvoices.length}</div>
                {unpaidInvoices.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, marginTop: 3 }}>
                    {unpaidSymbol} {unpaidTotal.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {totalRevenue > 0 && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,194,122,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Total revenue collected</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>
                  {paidInvoices[0]?.currency_symbol} {totalRevenue.toLocaleString()}
                </div>
              </div>
            )}

            <Link href="/documents/new" className="q-btn-primary" style={{ marginBottom: 20, textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
              New Quote
            </Link>

            <div className="q-section-header">
              <div className="q-section-title">Recent documents</div>
              <Link href="/documents" className="q-section-link">See all</Link>
            </div>

            {recent.map(quote => (
              <Link key={quote.id} href={`/documents/${quote.id}`} className="q-doc-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{getClientName(quote.client_id)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{quote.quote_number}</div>
                  </div>
                  <span className={`q-badge ${getStatusStyle(quote.status)}`}>{quote.status.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{quote.issue_date}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                    {quote.currency_symbol} {Number(quote.total).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      <nav className="q-bottomnav">
        <Link href="/dashboard" className="q-nav-item active">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="#6c47ff"/>
            <rect x="12" y="2" width="8" height="8" rx="2" fill="#6c47ff"/>
            <rect x="2" y="12" width="8" height="8" rx="2" fill="#6c47ff"/>
            <rect x="12" y="12" width="8" height="8" rx="2" fill="#6c47ff"/>
          </svg>
          <span className="q-nav-label" style={{ color: 'var(--purple)' }}>Dashboard</span>
          <div className="q-nav-dot"/>
        </Link>
        <Link href="/documents" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8M7 11h8M7 15h5" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="q-nav-label">Docs</span>
        </Link>
        <Link href="/clients" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="8" r="4" stroke="#a8a5c0" strokeWidth="1.5"/>
            <path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="q-nav-label">Clients</span>
        </Link>
        <Link href="/settings" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3" stroke="#a8a5c0" strokeWidth="1.5"/>
            <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#a8a5c0" strokeWidth="1.5"/>
          </svg>
          <span className="q-nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  )
}