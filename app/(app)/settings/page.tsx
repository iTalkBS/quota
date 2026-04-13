'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

const DEFAULT_PAYMENT_TERMS = `- Prices are valid for 7 days from the date of this quotation.
- Prices may change after the validity period.
- When making payment, please use your name or company name as the payment reference.
- For queries, please contact us via WhatsApp: `

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [vatRegistrationNumber, setVatRegistrationNumber] = useState('')
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankBranchCode, setBankBranchCode] = useState('')
  const [bankSwiftCode, setBankSwiftCode] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setBusinessName(data.business_name || '')
        setContactPerson(data.contact_person || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddress(data.address || '')
        setRegistrationNumber(data.registration_number || '')
        setVatRegistrationNumber(data.vat_registration_number || '')
        setCountry(data.country || '')
        setCurrencyCode(data.currency_code || '')
        setCurrencySymbol(data.currency_symbol || '')
        setVatRate(data.default_vat_rate?.toString() || '')
        setBankName(data.bank_name || '')
        setBankAccountName(data.bank_account_name || '')
        setBankAccountNumber(data.bank_account_number || '')
        setBankBranchCode(data.bank_branch_code || '')
        setBankSwiftCode(data.bank_swift_code || '')
        setPaymentTerms(data.payment_terms || DEFAULT_PAYMENT_TERMS + (data.phone || ''))
        const found = countries.find(c => c.name === data.country)
        if (found) setCountryCode(found.code)
      }
      setFetching(false)
    }
    loadProfile()
  }, [])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.code === e.target.value)
    if (selected) {
      setCountryCode(selected.code)
      setCountry(selected.name)
      setCurrencyCode(selected.currency_code)
      setCurrencySymbol(selected.currency_symbol)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .update({
        business_name: businessName,
        contact_person: contactPerson,
        phone,
        email,
        address,
        registration_number: registrationNumber,
        vat_registration_number: vatRegistrationNumber,
        country,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        default_vat_rate: parseFloat(vatRate) || 0,
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        bank_branch_code: bankBranchCode,
        bank_swift_code: bankSwiftCode,
        payment_terms: paymentTerms,
      })
      .eq('id', user.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="px-6 py-6 space-y-3">
        {saved && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
            Settings saved successfully
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('business')}
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Business profile</span>
            <span className="text-gray-400 text-lg">{expandedSection === 'business' ? '∧' : '∨'}</span>
          </button>
          {expandedSection === 'business' && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Full name of contact person"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="+27 123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Your business address"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('registration')}
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Registration details</span>
            <span className="text-gray-400 text-lg">{expandedSection === 'registration' ? '∧' : '∨'}</span>
          </button>
          {expandedSection === 'registration' && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company registration number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. 2024/123456/07"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT registration number</label>
                <input
                  type="text"
                  value={vatRegistrationNumber}
                  onChange={e => setVatRegistrationNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. 4123456789"
                />
              </div>
              <p className="text-xs text-gray-400">Leave blank if your business is not VAT registered</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('currency')}
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Country and currency</span>
            <span className="text-gray-400 text-lg">{expandedSection === 'currency' ? '∧' : '∨'}</span>
          </button>
          {expandedSection === 'currency' && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  onChange={handleCountryChange}
                  value={countryCode}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                >
                  <option value="">Select your country</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.currency_code})
                    </option>
                  ))}
                </select>
              </div>
              {currencyCode && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-sm text-green-700">
                    Currency: <strong>{currencyCode} ({currencySymbol})</strong>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default VAT rate (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={e => setVatRate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. 15"
                />
                <p className="text-xs text-gray-400 mt-1">Set to 0 if you do not charge VAT</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('banking')}
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Banking details</span>
            <span className="text-gray-400 text-lg">{expandedSection === 'banking' ? '∧' : '∨'}</span>
          </button>
          {expandedSection === 'banking' && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. First National Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account name</label>
                <input
                  type="text"
                  value={bankAccountName}
                  onChange={e => setBankAccountName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Name on the account"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account number</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={e => setBankAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Your account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch code</label>
                <input
                  type="text"
                  value={bankBranchCode}
                  onChange={e => setBankBranchCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. 250655"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT code</label>
                <input
                  type="text"
                  value={bankSwiftCode}
                  onChange={e => setBankSwiftCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="e.g. FIRNZAJJ"
                />
              </div>
              <p className="text-xs text-gray-400">SWIFT code is required for international payments</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleSection('terms')}
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Payment terms</span>
            <span className="text-gray-400 text-lg">{expandedSection === 'terms' ? '∧' : '∨'}</span>
          </button>
          {expandedSection === 'terms' && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
              <textarea
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                placeholder="Enter your payment terms..."
              />
              <p className="text-xs text-gray-400">These terms appear at the bottom of every quote and invoice</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Link
            href="/settings/items"
            className="w-full flex justify-between items-center px-4 py-4"
          >
            <span className="text-base font-semibold text-gray-900">Items directory</span>
            <span className="text-gray-400 text-lg">›</span>
          </Link>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save settings'}
        </button>

        <button
          onClick={handleSignOut}
          className="w-full border border-red-200 text-red-500 py-3 rounded-xl font-medium text-base"
        >
          Sign out
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">⊞</span>
          <span className="text-xs text-gray-400">Dashboard</span>
        </Link>
        <Link href="/documents" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Documents</span>
        </Link>
        <Link href="/clients" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Clients</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1">
          <span className="text-green-600 text-xl">◻</span>
          <span className="text-xs font-medium text-green-600">Settings</span>
        </Link>
      </nav>
    </div>
  )
}