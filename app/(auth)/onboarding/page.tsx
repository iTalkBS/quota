'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isWelcome = searchParams?.get('welcome') === '1'
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [vatRate, setVatRate] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!businessName.trim()) { setError('Business name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired. Please sign in again.'); setSaving(false); return }

    const selectedCountry = countries.find(c => c.code === countryCode)

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      business_name: businessName.trim(),
      phone: phone.trim(),
      country: selectedCountry?.name || '',
      currency_code: selectedCountry?.currency_code || 'USD',
      currency_symbol: selectedCountry?.currency_symbol || '$',
      default_vat_rate: parseFloat(vatRate) || 0,
      email: user.email,
    }, { onConflict: 'id' })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="q-page" style={{ background: 'linear-gradient(160deg, #6c47ff 0%, #9b6bff 50%, var(--bg) 100%)' }}>
      <div style={{ padding: '60px 24px 40px' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Welcome to Qouta</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>Let's set up your business in 30 seconds</div>
      </div>

      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '32px 20px 40px' }}>
        {isWelcome && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,194,122,0.3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>Email confirmed</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Your account is active. Now let's set up your business.</div>
          </div>
        )}

        {error && <div className="q-error">{error}</div>}

        <div className="q-form-group">
          <label className="q-label">Business name <span style={{ color: 'var(--red)' }}>*</span></label>
          <input
            className="q-input"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            placeholder="e.g. Tizo Trading"
            autoFocus
          />
        </div>

        <div className="q-form-group">
          <label className="q-label">Phone number</label>
          <input
            className="q-input"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+27 123 456 789"
          />
        </div>

        <div className="q-form-group">
          <label className="q-label">Country</label>
          <select
            className="q-select"
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
          >
            <option value="">Select your country</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>
            ))}
          </select>
        </div>

        <div className="q-form-group">
          <label className="q-label">Default VAT rate (%)</label>
          <input
            className="q-input"
            type="number"
            value={vatRate}
            onChange={e => setVatRate(e.target.value)}
            placeholder="0"
            min="0"
            max="100"
          />
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Set to 0 if you do not charge VAT</div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !businessName.trim()}
          className="q-btn-primary"
          style={{ marginTop: 8 }}
        >
          {saving ? 'Saving...' : 'Get started →'}
        </button>

        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16 }}>
          You can update all details later in Settings
        </div>
      </div>
    </div>
  )
}