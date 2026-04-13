'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [country, setCountry] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
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
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setAddress(data.address || '')
        setVatNumber(data.vat_number || '')
        setCountry(data.country || '')
        setCurrencyCode(data.currency_code || '')
        setCurrencySymbol(data.currency_symbol || '')
        setVatRate(data.default_vat_rate?.toString() || '')

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
        phone,
        email,
        address,
        vat_number: vatNumber,
        country,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        default_vat_rate: parseFloat(vatRate) || 0,
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

      <div className="px-6 py-6 space-y-4">
        {saved && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
            Settings saved successfully
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Business profile</h2>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VAT number</label>
            <input
              type="text"
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Country and currency</h2>

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
          </div>
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