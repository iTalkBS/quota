'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clearCache } from '@/lib/cache'

const AVATAR_COLORS = [
  { bg: 'var(--purple-bg)', color: 'var(--purple)' },
  { bg: 'var(--green-bg)', color: 'var(--green)' },
  { bg: 'var(--orange-bg)', color: 'var(--orange)' },
  { bg: 'var(--yellow-bg)', color: '#b38f00' },
]

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [client, setClient] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: clientData } = await supabase
        .from('clients').select('*').eq('id', params.id).single()
      if (clientData) {
        setClient(clientData)
        setName(clientData.name)
        setPhone(clientData.phone || '')
        setEmail(clientData.email || '')
        setAddress(clientData.address || '')
      }
      const { data: quotesData } = await supabase
        .from('quotes').select('*').eq('client_id', params.id).order('created_at', { ascending: false })
      if (quotesData) setQuotes(quotesData)
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSave = async () => {
    if (!name) return
    setSaving(true)
    await supabase.from('clients').update({ name, phone, email, address }).eq('id', params.id)
    setClient({ ...client, name, phone, email, address })
    clearCache('clients')
    clearCache('dashboard')
    setSaving(false)
    setEditing(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await supabase.from('clients').delete().eq('id', params.id)
    clearCache('clients')
    clearCache('dashboard')
    router.push('/clients')
  }

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      paid: 'badge-paid', unpaid: 'badge-unpaid', overdue: 'badge-overdue',
      converted: 'badge-converted', sent: 'badge-sent', accepted: 'badge-accepted',
      rejected: 'badge-rejected', draft: 'badge-draft',
    }
    return map[status] || 'badge-draft'
  }

  const getInitials = (n: string) => n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const getColor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]

  if (loading) return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div className="q-topbar-title">Client</div>
        <div style={{ width: 34 }}/>
      </div>
      <div className="q-scroll">
        <div className="q-skeleton-card">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
            <div className="q-skeleton" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12 }}/>
            <div className="q-skeleton" style={{ width: 150, height: 20, marginBottom: 6 }}/>
            <div className="q-skeleton" style={{ width: 100, height: 13 }}/>
          </div>
        </div>
      </div>
    </div>
  )

  if (!client) return <div className="q-page"><div className="q-loading">Client not found</div></div>

  const color = getColor(client.name)

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">{client.name}</div>
        <button
          onClick={() => setEditing(!editing)}
          style={{ background: editing ? 'var(--purple-bg)' : 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--purple)', padding: '6px 10px', borderRadius: 8 }}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="q-scroll">
        {showDeleteConfirm && (
          <div style={{ background: 'var(--red-bg)', border: '1.5px solid rgba(255,64,96,0.3)', borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>Delete this client?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Their quotes and invoices will not be deleted. This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="q-btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="q-btn-danger" style={{ flex: 1 }}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 24px' }}>
          <div className="q-avatar" style={{ width: 64, height: 64, fontSize: 22, background: color.bg, color: color.color, marginBottom: 12 }}>
            {getInitials(client.name)}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{client.name}</div>
          {client.phone && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{client.phone}</div>}
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Client details</div>

          {editing ? (
            <div>
              <div className="q-form-group">
                <label className="q-label">Name <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="q-input" value={name} onChange={e => setName(e.target.value)} placeholder="Client name"/>
              </div>
              <div className="q-form-group">
                <label className="q-label">Phone</label>
                <input className="q-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 123 456 789"/>
              </div>
              <div className="q-form-group">
                <label className="q-label">Email</label>
                <input className="q-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com"/>
              </div>
              <div className="q-form-group">
                <label className="q-label">Address</label>
                <input className="q-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Client address"/>
              </div>
              <button onClick={handleSave} disabled={saving || !name} className="q-btn-primary">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Phone', value: client.phone },
                { label: 'Email', value: client.email },
                { label: 'Address', value: client.address },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', width: 60, fontWeight: 600, paddingTop: 1 }}>{f.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text)', flex: 1 }}>{f.value}</div>
                </div>
              ))}
              {!client.phone && !client.email && !client.address && (
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>No additional details — tap Edit to add</div>
              )}
            </div>
          )}
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Documents ({quotes.length})
          </div>
          {quotes.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>No documents yet</div>
          ) : (
            quotes.map(quote => (
              <Link key={quote.id} href={`/documents/${quote.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{quote.quote_number}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{quote.issue_date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`q-badge ${getStatusStyle(quote.status)}`}>{quote.status.toUpperCase()}</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {quote.currency_symbol}{Number(quote.total).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {!showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="q-btn-danger"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3.5h10M4.5 3.5V2.5h5v1M5.5 6v4M8.5 6v4M3 3.5l.8 8h6.4l.8-8" stroke="#ff4060" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Delete client
          </button>
        )}
      </div>
    </div>
  )
}