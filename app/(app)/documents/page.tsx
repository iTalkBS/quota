'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices'>('quotes')
  const [quotes, setQuotes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const cached = getCached('documents')
      if (cached) {
        setQuotes(cached.quotes)
        setClients(cached.clients)
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: q }, { data: c }] = await Promise.all([
        supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name').eq('user_id', user.id),
      ])
      if (q) setQuotes(q)
      if (c) setClients(c)
      setCached('documents', { quotes: q, clients: c })
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

  const filtered = quotes.filter(q => {
    const matchesTab = activeTab === 'quotes' ? q.type === 'quote' : q.type === 'invoice'
    const clientName = getClientName(q.client_id).toLowerCase()
    const matchesSearch = search === '' ||
      clientName.includes(search.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="q-page">
      <div className="q-topbar">
        <div style={{ width: 34 }} />
        <div className="q-topbar-title">Documents</div>
        <div style={{ width: 34 }} />
      </div>

      <div className="q-scroll">
        <div className="q-tab-row">
          <button
            className={`q-tab ${activeTab === 'quotes' ? 'q-tab-active' : 'q-tab-inactive'}`}
            onClick={() => { setActiveTab('quotes'); setSearch('') }}
          >
            Quotes
          </button>
          <button
            className={`q-tab ${activeTab === 'invoices' ? 'q-tab-active' : 'q-tab-inactive'}`}
            onClick={() => { setActiveTab('invoices'); setSearch('') }}
          >
            Invoices
          </button>
        </div>

        <div className="q-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#a8a5c0" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or number..."
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {loading ? (
          <div className="q-loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="q-empty">
            <div className="q-empty-title">No {activeTab} found</div>
            <div className="q-empty-sub">{search ? 'Try a different search' : `Tap + to create your first ${activeTab === 'quotes' ? 'quote' : 'invoice'}`}</div>
          </div>
        ) : (
          filtered.map(quote => (
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
      </div>

      <Link href="/documents/new" className="q-fab">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </Link>

      <nav className="q-bottomnav">
        <Link href="/dashboard" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/>
            <rect x="12" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/>
            <rect x="2" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/>
            <rect x="12" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/>
          </svg>
          <span className="q-nav-label">Dashboard</span>
        </Link>
        <Link href="/documents" className="q-nav-item active">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8M7 11h8M7 15h5" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="q-nav-label" style={{ color: 'var(--purple)' }}>Docs</span>
          <div className="q-nav-dot"/>
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