'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [country, setCountry] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [noVat, setNoVat] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.code === e.target.value)
    if (selected) {
      setCountryCode(selected.code)
      setCountry(selected.name)
      setCurrencyCode(selected.currency_code)
      setCurrencySymbol(selected.currency_symbol)
    }
  }

  const isValid = businessName && phone && countryCode

  const handleSubmit = async () => {
    if (!isValid) { setError('Please fill in all required fields'); return }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { error: updateError } = await supabase.from('profiles').update({
      business_name: businessName,
      phone,
      country,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      default_vat_rate: noVat ? 0 : parseFloat(vatRate) || 0,
    }).eq('id', user.id)
    if (updateError) { setError(updateError.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="q-page" style={{ minHeight: '100svh' }}>
      <div style={{ background: 'linear-gradient(135deg, #6c47ff, #9b6bff)', padding: '52px 24px 40px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>Welcome to Qouta</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Set up your business details to get started</div>
      </div>

      <div style={{ padding: '24px 16px 100px' }}>
        {error && <div className="q-error">{error}</div>}

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Business details</div>

          <div className="q-form-group">
            <label className="q-label">Business name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className="q-input" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business name"/>
          </div>

          <div className="q-form-group">
            <label className="q-label">Phone number <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className="q-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27 123 456 789"/>
          </div>

          <div className="q-form-group">
            <label className="q-label">Country <span style={{ color: 'var(--red)' }}>*</span></label>
            <select className="q-select" value={countryCode} onChange={handleCountryChange}>
              <option value="">Select your country</option>
              {countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>)}
            </select>
          </div>

          {currencyCode && (
            <div className="q-info">
              Currency automatically set to <strong>{currencyCode} ({currencySymbol})</strong>
            </div>
          )}
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>VAT settings</div>

          <div className="q-form-group">
            <label className="q-label">Default VAT rate (%)</label>
            <input
              className="q-input"
              type="number"
              value={vatRate}
              onChange={e => setVatRate(e.target.value)}
              disabled={noVat}
              placeholder="e.g. 15"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="q-toggle">
              <input type="checkbox" checked={noVat} onChange={e => setNoVat(e.target.checked)}/>
              <span className="q-toggle-slider"/>
            </label>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>I do not charge VAT</span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !isValid} className="q-btn-primary">
          {loading ? 'Setting up...' : 'Get started'}
        </button>
      </div>
    </div>
  )
}