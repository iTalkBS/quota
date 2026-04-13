'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
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
      setCountry(selected.name)
      setCurrencyCode(selected.currency_code)
      setCurrencySymbol(selected.currency_symbol)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    if (!businessName || !phone || !country) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: businessName,
        phone,
        country,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        default_vat_rate: noVat ? 0 : parseFloat(vatRate) || 0,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Qouta</h1>
        <p className="text-gray-500 mt-2">Set up your business details</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={e => setBusinessName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            placeholder="Your business name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            placeholder="+27 123 456 789"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            onChange={handleCountryChange}
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
          <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm text-green-700">
              Currency set to <strong>{currencyCode} ({currencySymbol})</strong>
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VAT rate (%)
          </label>
          <input
            type="number"
            value={vatRate}
            onChange={e => setVatRate(e.target.value)}
            disabled={noVat}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 disabled:opacity-50 disabled:bg-gray-50"
            placeholder="e.g. 15"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={noVat}
              onChange={e => setNoVat(e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-600">I do not charge VAT</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Get started'}
        </button>
      </div>
    </div>
  )
}