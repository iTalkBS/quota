'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

const DEFAULT_PAYMENT_TERMS = `- Prices are valid for 7 days from the date of this quotation.\n- Prices may change after the validity period.\n- When making payment, please use your name or company name as the payment reference.\n- For queries, please contact us via WhatsApp: `

type FormState = {
  business_name: string
  contact_person: string
  phone: string
  email: string
  address: string
  registration_number: string
  vat_registration_number: string
  country: string
  currency_code: string
  currency_symbol: string
  default_vat_rate: string
  bank_name: string
  bank_account_name: string
  bank_account_number: string
  bank_branch_code: string
  bank_swift_code: string
  payment_terms: string
}

const SectionHeader = ({ id, iconBg, icon, label, preview, expanded, onToggle }: any) => (
  <button
    className="q-collapsible-header"
    onClick={() => onToggle(id)}
    style={{ width: '100%' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="q-settings-icon" style={{ background: iconBg }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{label}</div>
        {preview && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, textAlign: 'left' }}>{preview}</div>}
      </div>
    </div>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={expanded ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </button>
)

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>({
    business_name: '', contact_person: '', phone: '', email: '', address: '',
    registration_number: '', vat_registration_number: '',
    country: '', currency_code: '', currency_symbol: '',
    default_vat_rate: '', bank_name: '', bank_account_name: '',
    bank_account_number: '', bank_branch_code: '', bank_swift_code: '',
    payment_terms: '',
  })
  const [countryCode, setCountryCode] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [dirtySection, setDirtySection] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setForm({
          business_name: data.business_name || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          registration_number: data.registration_number || '',
          vat_registration_number: data.vat_registration_number || '',
          country: data.country || '',
          currency_code: data.currency_code || '',
          currency_symbol: data.currency_symbol || '',
          default_vat_rate: data.default_vat_rate?.toString() || '',
          bank_name: data.bank_name || '',
          bank_account_name: data.bank_account_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_branch_code: data.bank_branch_code || '',
          bank_swift_code: data.bank_swift_code || '',
          payment_terms: data.payment_terms || DEFAULT_PAYMENT_TERMS + (data.phone || ''),
        })
        const found = countries.find(c => c.name === data.country)
        if (found) setCountryCode(found.code)
      }
      setFetching(false)
    }
    loadProfile()
  }, [])

  const setField = useCallback((field: keyof FormState, value: string, section: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setDirtySection(section)
  }, [])

  const handleCountryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>, section: string) => {
    const selected = countries.find(c => c.code === e.target.value)
    if (selected) {
      setCountryCode(selected.code)
      setForm(prev => ({ ...prev, country: selected.name, currency_code: selected.currency_code, currency_symbol: selected.currency_symbol }))
      setDirtySection(section)
    }
  }, [])

  const handleSaveSection = useCallback(async (section: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      ...form,
      default_vat_rate: parseFloat(form.default_vat_rate) || 0,
    }).eq('id', user.id)
    setLoading(false)
    setDirtySection(null)
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2500)
  }, [form])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggle = useCallback((s: string) => {
    setExpandedSection(prev => prev === s ? null : s)
  }, [])

  if (fetching) return (
    <div className="q-page">
      <div className="q-topbar">
        <div style={{ width: 34 }}/>
        <div className="q-topbar-title">Settings</div>
        <div style={{ width: 34 }}/>
      </div>
      <div className="q-scroll">
        <div className="q-skeleton-card" style={{ padding: 18, marginBottom: 14, borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="q-skeleton" style={{ width: 50, height: 50, borderRadius: '50%' }}/>
            <div>
              <div className="q-skeleton" style={{ width: 140, height: 16, marginBottom: 8 }}/>
              <div className="q-skeleton" style={{ width: 100, height: 12 }}/>
            </div>
          </div>
        </div>
        {[1,2,3,4].map(i => (
          <div key={i} className="q-skeleton-card" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="q-skeleton" style={{ width: 32, height: 32, borderRadius: 8 }}/>
              <div>
                <div className="q-skeleton" style={{ width: 120, height: 14, marginBottom: 6 }}/>
                <div className="q-skeleton" style={{ width: 80, height: 11 }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="q-page">
      <div className="q-topbar">
        <div style={{ width: 34 }}/>
        <div className="q-topbar-title">Settings</div>
        <div style={{ width: 34 }}/>
      </div>

      <div className="q-scroll">
        <div
          className="q-profile-card"
          onClick={() => setShowProfile(p => !p)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
            {form.business_name?.[0]?.toUpperCase() || 'Q'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{form.business_name || 'Your business'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{form.country || 'Set your country'} · {form.currency_code || 'USD'}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d={showProfile ? 'M5 12l5-5 5 5' : 'M5 8l5 5 5-5'} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {showProfile && (
          <div style={{ marginBottom: 14 }}>

            <div className="q-settings-section">
              <SectionHeader
                id="business"
                iconBg="var(--purple-bg)"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="#6c47ff" strokeWidth="1.5"/><path d="M5 8h6M5 5h4M5 11h3" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                label="Business profile"
                preview={form.business_name ? `${form.business_name} · ${form.phone}` : 'Set your business details'}
                expanded={expandedSection === 'business'}
                onToggle={toggle}
              />
              {expandedSection === 'business' && (
                <div className="q-collapsible-body">
                  <div className="q-form-group">
                    <label className="q-label">Business name</label>
                    <input className="q-input" value={form.business_name} onChange={e => setField('business_name', e.target.value, 'business')} placeholder="Your business name"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Contact person</label>
                    <input className="q-input" value={form.contact_person} onChange={e => setField('contact_person', e.target.value, 'business')} placeholder="Full name"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Phone</label>
                    <input className="q-input" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value, 'business')} placeholder="+27 123 456 789"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Email</label>
                    <input className="q-input" type="email" value={form.email} onChange={e => setField('email', e.target.value, 'business')} placeholder="you@example.com"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Address</label>
                    <input className="q-input" value={form.address} onChange={e => setField('address', e.target.value, 'business')} placeholder="Business address"/>
                  </div>
                  {dirtySection === 'business' && (
                    <button onClick={() => handleSaveSection('business')} disabled={loading} className="q-btn-primary" style={{ marginTop: 4 }}>
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                  {savedSection === 'business' && <div className="q-success" style={{ marginTop: 8 }}>Saved successfully</div>}
                </div>
              )}
            </div>

            <div className="q-settings-section">
              <SectionHeader
                id="registration"
                iconBg="var(--green-bg)"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#00c27a" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                label="Registration details"
                preview="Company reg · VAT number"
                expanded={expandedSection === 'registration'}
                onToggle={toggle}
              />
              {expandedSection === 'registration' && (
                <div className="q-collapsible-body">
                  <div className="q-form-group">
                    <label className="q-label">Company registration number</label>
                    <input className="q-input" value={form.registration_number} onChange={e => setField('registration_number', e.target.value, 'registration')} placeholder="e.g. 2024/123456/07"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">VAT registration number</label>
                    <input className="q-input" value={form.vat_registration_number} onChange={e => setField('vat_registration_number', e.target.value, 'registration')} placeholder="e.g. 4123456789"/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Leave blank if not VAT registered</div>
                  {dirtySection === 'registration' && (
                    <button onClick={() => handleSaveSection('registration')} disabled={loading} className="q-btn-primary">
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                  {savedSection === 'registration' && <div className="q-success" style={{ marginTop: 8 }}>Saved successfully</div>}
                </div>
              )}
            </div>

            <div className="q-settings-section">
              <SectionHeader
                id="currency"
                iconBg="var(--orange-bg)"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#ff7a2f" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                label="Country and currency"
                preview={form.country ? `${form.country} · ${form.currency_code} (${form.currency_symbol})` : 'Set your country'}
                expanded={expandedSection === 'currency'}
                onToggle={toggle}
              />
              {expandedSection === 'currency' && (
                <div className="q-collapsible-body">
                  <div className="q-form-group">
                    <label className="q-label">Country</label>
                    <select className="q-select" value={countryCode} onChange={e => handleCountryChange(e, 'currency')}>
                      <option value="">Select your country</option>
                      {countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>)}
                    </select>
                  </div>
                  {form.currency_code && (
                    <div className="q-info" style={{ marginBottom: 14 }}>Currency: <strong>{form.currency_code} ({form.currency_symbol})</strong></div>
                  )}
                  <div className="q-form-group">
                    <label className="q-label">Default VAT rate (%)</label>
                    <input className="q-input" type="number" value={form.default_vat_rate} onChange={e => setField('default_vat_rate', e.target.value, 'currency')} placeholder="e.g. 15"/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Set to 0 if you do not charge VAT</div>
                  {dirtySection === 'currency' && (
                    <button onClick={() => handleSaveSection('currency')} disabled={loading} className="q-btn-primary">
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                  {savedSection === 'currency' && <div className="q-success" style={{ marginTop: 8 }}>Saved successfully</div>}
                </div>
              )}
            </div>

            <div className="q-settings-section">
              <SectionHeader
                id="banking"
                iconBg="var(--yellow-bg)"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="2" stroke="#b38f00" strokeWidth="1.5"/><path d="M2 7h12" stroke="#b38f00" strokeWidth="1.5"/><path d="M5 10h2M10 10h1" stroke="#b38f00" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                label="Banking details"
                preview={form.bank_name ? `${form.bank_name} · ${form.bank_account_number ? '••••' + form.bank_account_number.slice(-4) : ''}` : 'Add your bank details'}
                expanded={expandedSection === 'banking'}
                onToggle={toggle}
              />
              {expandedSection === 'banking' && (
                <div className="q-collapsible-body">
                  <div className="q-form-group">
                    <label className="q-label">Bank name</label>
                    <input className="q-input" value={form.bank_name} onChange={e => setField('bank_name', e.target.value, 'banking')} placeholder="e.g. First National Bank"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Account name</label>
                    <input className="q-input" value={form.bank_account_name} onChange={e => setField('bank_account_name', e.target.value, 'banking')} placeholder="Name on the account"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Account number</label>
                    <input className="q-input" value={form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value, 'banking')} placeholder="Your account number"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Branch code</label>
                    <input className="q-input" value={form.bank_branch_code} onChange={e => setField('bank_branch_code', e.target.value, 'banking')} placeholder="e.g. 250655"/>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">SWIFT code</label>
                    <input className="q-input" value={form.bank_swift_code} onChange={e => setField('bank_swift_code', e.target.value, 'banking')} placeholder="e.g. FIRNZAJJ"/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>SWIFT code required for international payments</div>
                  {dirtySection === 'banking' && (
                    <button onClick={() => handleSaveSection('banking')} disabled={loading} className="q-btn-primary">
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                  {savedSection === 'banking' && <div className="q-success" style={{ marginTop: 8 }}>Saved successfully</div>}
                </div>
              )}
            </div>

            <div className="q-settings-section">
              <SectionHeader
                id="terms"
                iconBg="var(--purple-bg)"
                icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                label="Payment terms"
                preview="Appears on every quote and invoice"
                expanded={expandedSection === 'terms'}
                onToggle={toggle}
              />
              {expandedSection === 'terms' && (
                <div className="q-collapsible-body">
                  <div className="q-form-group">
                    <label className="q-label">Payment terms</label>
                    <textarea className="q-textarea" rows={8} value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value, 'terms')}/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>These terms appear at the bottom of every PDF</div>
                  {dirtySection === 'terms' && (
                    <button onClick={() => handleSaveSection('terms')} disabled={loading} className="q-btn-primary">
                      {loading ? 'Saving...' : 'Save changes'}
                    </button>
                  )}
                  {savedSection === 'terms' && <div className="q-success" style={{ marginTop: 8 }}>Saved successfully</div>}
                </div>
              )}
            </div>

            <div className="q-settings-section" style={{ marginBottom: 10 }}>
              <button
                onClick={handleSignOut}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="q-settings-icon" style={{ background: 'var(--red-bg)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="#ff4060" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>Sign out</div>
              </button>
            </div>
          </div>
        )}

        <Link href="/settings/items" className="q-settings-section" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="q-settings-row" style={{ border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="q-settings-icon" style={{ background: 'var(--green-bg)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="#00c27a" strokeWidth="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="#00c27a" strokeWidth="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="#00c27a" strokeWidth="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="#00c27a" strokeWidth="1.5"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Items directory</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Manage your products and services</div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </Link>
      </div>

      <nav className="q-bottomnav">
        <Link href="/dashboard" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="2" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="2" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/><rect x="12" y="12" width="8" height="8" rx="2" fill="#a8a5c0"/></svg>
          <span className="q-nav-label">Dashboard</span>
        </Link>
        <Link href="/documents" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 5h8M7 11h8M7 15h5" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label">Docs</span>
        </Link>
        <Link href="/clients" className="q-nav-item">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#a8a5c0" strokeWidth="1.5"/><path d="M3 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="q-nav-label">Clients</span>
        </Link>
        <Link href="/settings" className="q-nav-item active">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3" stroke="#6c47ff" strokeWidth="1.5"/><path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.9 4.9l1.4 1.4M15.7 15.7l1.4 1.4M4.9 17.1l1.4-1.4M15.7 6.3l1.4-1.4" stroke="#6c47ff" strokeWidth="1.5"/></svg>
          <span className="q-nav-label" style={{ color: 'var(--purple)' }}>Settings</span>
          <div className="q-nav-dot"/>
        </Link>
      </nav>
    </div>
  )
}