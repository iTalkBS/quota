'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

const DEFAULT_PAYMENT_TERMS = `- Prices are valid for 7 days from the date of this quotation.\n- Prices may change after the validity period.\n- When making payment, please use your name or company name as the payment reference.\n- For queries, please contact us via WhatsApp: `

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({
    business_name: '', contact_person: '', phone: '', email: '', address: '',
    registration_number: '', vat_registration_number: '',
    country: '', currency_code: '', currency_symbol: '',
    default_vat_rate: '', bank_name: '', bank_account_name: '',
    bank_account_number: '', bank_branch_code: '', bank_swift_code: '',
    payment_terms: '',
  })
  const [countryCode, setCountryCode] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
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

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.code === e.target.value)
    if (selected) {
      setCountryCode(selected.code)
      setForm(f => ({ ...f, country: selected.name, currency_code: selected.currency_code, currency_symbol: selected.currency_symbol }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      ...form,
      default_vat_rate: parseFloat(form.default_vat_rate) || 0,
    }).eq('id', user.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggle = (s: string) => setExpandedSection(expandedSection === s ? null : s)

  const Section = ({ id, icon, iconBg, label, preview, children }: any) => (
    <div className="q-settings-section">
      <button className="q-collapsible-header" onClick={() => toggle(id)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="q-settings-icon" style={{ background: iconBg }}>{icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
            {preview && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{preview}</div>}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d={expandedSection === id ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {expandedSection === id && (
        <div className="q-collapsible-body">{children}</div>
      )}
    </div>
  )

  const Field = ({ label, children }: any) => (
    <div className="q-form-group">
      <label className="q-label">{label}</label>
      {children}
    </div>
  )

  if (fetching) return <div className="q-page"><div className="q-loading">Loading...</div></div>

  return (
    <div className="q-page">
      <div className="q-topbar">
        <div style={{ width: 34 }} />
        <div className="q-topbar-title">Settings</div>
        <div style={{ width: 34 }} />
      </div>

      <div className="q-scroll">
        <div className="q-profile-card">
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
            {form.business_name?.[0]?.toUpperCase() || 'Q'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{form.business_name || 'Your business'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{form.country || 'Set your country'} · {form.currency_code || 'USD'}</div>
          </div>
        </div>

        {saved && <div className="q-success">Settings saved successfully</div>}

        <Section
          id="business"
          iconBg="var(--purple-bg)"
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="#6c47ff" strokeWidth="1.5"/><path d="M5 8h6M5 5h4M5 11h3" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Business profile"
          preview={form.business_name ? `${form.business_name} · ${form.phone}` : 'Set your business details'}
        >
          <Field label="Business name"><input className="q-input" value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Your business name"/></Field>
          <Field label="Contact person"><input className="q-input" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Full name"/></Field>
          <Field label="Phone"><input className="q-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+27 123 456 789"/></Field>
          <Field label="Email"><input className="q-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com"/></Field>
          <Field label="Address"><input className="q-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Business address"/></Field>
        </Section>

        <Section
          id="registration"
          iconBg="var(--green-bg)"
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#00c27a" strokeWidth="1.5"/><path d="M5 8l2 2 4-4" stroke="#00c27a" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Registration details"
          preview="Company reg · VAT number"
        >
          <Field label="Company registration number"><input className="q-input" value={form.registration_number} onChange={e => set('registration_number', e.target.value)} placeholder="e.g. 2024/123456/07"/></Field>
          <Field label="VAT registration number"><input className="q-input" value={form.vat_registration_number} onChange={e => set('vat_registration_number', e.target.value)} placeholder="e.g. 4123456789"/></Field>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -8 }}>Leave blank if not VAT registered</div>
        </Section>

        <Section
          id="currency"
          iconBg="var(--orange-bg)"
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#ff7a2f" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="#ff7a2f" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Country and currency"
          preview={form.country ? `${form.country} · ${form.currency_code} (${form.currency_symbol})` : 'Set your country'}
        >
          <Field label="Country">
            <select className="q-select" value={countryCode} onChange={handleCountryChange}>
              <option value="">Select your country</option>
              {countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>)}
            </select>
          </Field>
          {form.currency_code && (
            <div className="q-info" style={{ marginBottom: 14 }}>Currency set to <strong>{form.currency_code} ({form.currency_symbol})</strong></div>
          )}
          <Field label="Default VAT rate (%)">
            <input className="q-input" type="number" value={form.default_vat_rate} onChange={e => set('default_vat_rate', e.target.value)} placeholder="e.g. 15"/>
          </Field>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -8 }}>Set to 0 if you do not charge VAT</div>
        </Section>

        <Section
          id="banking"
          iconBg="var(--yellow-bg)"
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="2" stroke="#b38f00" strokeWidth="1.5"/><path d="M2 7h12" stroke="#b38f00" strokeWidth="1.5"/><path d="M5 10h2M10 10h1" stroke="#b38f00" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Banking details"
          preview={form.bank_name ? `${form.bank_name} · ${form.bank_account_number ? '••••' + form.bank_account_number.slice(-4) : 'No account'}` : 'Add your bank details'}
        >
          <Field label="Bank name"><input className="q-input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. First National Bank"/></Field>
          <Field label="Account name"><input className="q-input" value={form.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} placeholder="Name on the account"/></Field>
          <Field label="Account number"><input className="q-input" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} placeholder="Your account number"/></Field>
          <Field label="Branch code"><input className="q-input" value={form.bank_branch_code} onChange={e => set('bank_branch_code', e.target.value)} placeholder="e.g. 250655"/></Field>
          <Field label="SWIFT code">
            <input className="q-input" value={form.bank_swift_code} onChange={e => set('bank_swift_code', e.target.value)} placeholder="e.g. FIRNZAJJ"/>
          </Field>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -8 }}>SWIFT code required for international payments</div>
        </Section>

        <Section
          id="terms"
          iconBg="var(--purple-bg)"
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="#6c47ff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          label="Payment terms"
          preview="Appears on every quote and invoice"
        >
          <Field label="Payment terms">
            <textarea className="q-textarea" rows={8} value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}/>
          </Field>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -8 }}>These terms appear at the bottom of every PDF</div>
        </Section>

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

        <button onClick={handleSave} disabled={loading} className="q-btn-primary" style={{ marginBottom: 10 }}>
          {loading ? 'Saving...' : 'Save settings'}
        </button>

        <button onClick={handleSignOut} className="q-btn-danger">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="#ff4060" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Sign out
        </button>
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