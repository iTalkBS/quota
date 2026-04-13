'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = name && phone

  const handleSave = async () => {
    if (!isValid) { setError('Name and phone are required'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: saveError } = await supabase
      .from('clients')
      .insert({ name, phone, email, address, user_id: user.id })
    if (saveError) { setError(saveError.message); setLoading(false) }
    else router.push('/clients')
  }

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">New Client</div>
        <div style={{ width: 34 }}/>
      </div>

      <div className="q-scroll">
        {error && <div className="q-error">{error}</div>}

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Client details</div>

          <div className="q-form-group">
            <label className="q-label">Name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className="q-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Client name"/>
          </div>

          <div className="q-form-group">
            <label className="q-label">Phone <span style={{ color: 'var(--red)' }}>*</span></label>
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
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !isValid}
          className="q-btn-primary"
        >
          {loading ? 'Saving...' : 'Save client'}
        </button>
      </div>
    </div>
  )
}