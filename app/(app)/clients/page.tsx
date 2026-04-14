'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCached, setCached } from '@/lib/cache'

const AVATAR_COLORS = [
  { bg: 'var(--purple-bg)', color: 'var(--purple)' },
  { bg: 'var(--green-bg)', color: 'var(--green)' },
  { bg: 'var(--orange-bg)', color: 'var(--orange)' },
  { bg: 'var(--yellow-bg)', color: '#b38f00' },
]

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [quoteCounts, setQuoteCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadClients = async () => {
      const cached = getCached('clients')
      if (cached) {
        setClients(cached.clients || cached)
        setQuoteCounts(cached.quoteCounts || {})
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: clientsData }, { data: quotesData }] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
        supabase.from('quotes').select('client_id').eq('user_id', user.id),
      ])
      const counts: Record<string, number> = {}
      if (quotesData) {
        quotesData.forEach((q: any) => {
          if (q.client_id) counts[q.client_id] = (counts[q.client_id] || 0) + 1
        })
      }
      if (clientsData) setClients(clientsData)
      setQuoteCounts(counts)
      setCached('clients', { clients: clientsData, quoteCounts: counts })
      setLoading(false)
    }
    loadClients()
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name: string) =>
    name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const getColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

  return (
    <div className="q-page">
      <div className="q-topbar">
        <div style={{ width: 34 }}/>
        <div className="q-topbar-title">Clients</div>
        <div style={{ width: 34 }}/>
      </div>

      <div className="q-scroll">
        <div className="q-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#a8a5c0" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {loading ? (
          <div className="q-loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="q-empty">
            <div className="q-empty-title">{search ? 'No clients found' : 'No clients yet'}</div>
            <div className="q-empty-sub">{search ? 'Try a different search' : 'Clients are saved automatically when you create a quote'}</div>
          </div>
        ) : (
          filtered.map(client => {
            const color = getColor(client.name)
            const count = quoteCounts[client.id] || 0
            return (
              <Link key={client.id} href={`/clients/${client.id}`} className="q-client-card">
                <div className="q-avatar" style={{ background: color.bg, color: color.color }}>
                  {getInitials(client.name)}
                </div>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    {client.phone || client.email || 'No contact info'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {count > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'var(--purple-bg)', color: 'var(--purple)' }}>
                      {count} doc{count !== 1 ? 's' : ''}
                    </span>
                  )}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <Link href="/clients/new" className="q-fab">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </Link>

      <nav className="q-bottomnav">
        <Link href="/dashboard" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="2" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/></svg>
          <span className="q-nav-label">Dashboard</span>
        </Link>
        <Link href="/documents" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8M7 11h8M7 15h5" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label">Docs</span>
        </Link>
        <Link href="/clients" className="q-nav-item active">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#6c47ff" strokeWidth="1.5"/><path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label" style={{ color: 'var(--purple)' }}>Clients</span>
          <div className="q-nav-dot"/>
        </Link>
        <Link href="/settings" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3" stroke="#a8a5c0" strokeWidth="1.5"/><path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#a8a5c0" strokeWidth="1.5"/></svg>
          <span className="q-nav-label">Settings</span>
        </Link>
      </nav>
    </div>
  )
}