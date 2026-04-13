'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
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
      setLoading(false)
    }
    loadData()
  }, [])

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Unknown client'

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge-paid', unpaid: 'badge-unpaid', overdue: 'badge-overdue',
      converted: 'badge-converted', sent: 'badge-sent', accepted: 'badge-accepted',
      rejected: 'badge-rejected', draft: 'badge-draft',
    }
    return map[status] || 'badge-draft'
  }

  const totalQuotes = quotes.filter(q => q.type === 'quote').length
  const unpaidInvoices = quotes.filter(q => q.type === 'invoice' && q.status === 'unpaid')
  const unpaidTotal = unpaidInvoices.reduce((sum, q) => sum + Number(q.total), 0)
  const unpaidSymbol = unpaidInvoices[0]?.currency_symbol || ''
  const recent = quotes.slice(0, 5)

  return (
    <div className="q-page">
      <div className="q-header-gradient" style={{ paddingTop: 56 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Qouta</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {profile?.business_name || 'Welcome back'}
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {profile?.business_name?.[0]?.toUpperCase() || 'Q'}
          </div>
        </div>
      </div>

      <div className="q-scroll" style={{ paddingTop: 24 }}>
        <div className="q-stat-grid">
          <div className="q-stat">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Total quotes</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>{totalQuotes}</div>
            <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, marginTop: 3 }}>all time</div>
          </div>
          <div className="q-stat">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Unpaid</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>{unpaidInvoices.length}</div>
            {unpaidInvoices.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, marginTop: 3 }}>
                {unpaidSymbol} {unpaidTotal.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <Link href="/documents/new" className="q-btn-primary" style={{ marginBottom: 20, textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
          New Quote
        </Link>

        {loading ? (
          <div className="q-loading">Loading...</div>
        ) : (
          <>
            <div className="q-section-header">
              <div className="q-section-title">Recent documents</div>
              <Link href="/documents" className="q-section-link">See all</Link>
            </div>

            {recent.length === 0 ? (
              <div className="q-empty">
                <div className="q-empty-title">No documents yet</div>
                <div className="q-empty-sub">Create your first quote to get started</div>
              </div>
            ) : (
              recent.map(quote => (
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
              ))
            )}
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