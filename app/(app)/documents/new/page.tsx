'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

type Item = {
  name: string
  item_type: 'product' | 'service'
  quantity: string
  unit_price: string
  line_total: number
}

type Profile = {
  business_name: string
  currency_code: string
  currency_symbol: string
  default_vat_rate: number
  phone: string
  email: string
  address: string
}

export default function NewQuotePage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Profile | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' })
  const [isNewClient, setIsNewClient] = useState(false)

  const [items, setItems] = useState<Item[]>([{ name: '', item_type: 'product', quantity: '', unit_price: '', line_total: 0 }])
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [vatRate, setVatRate] = useState(0)
  const [vatEnabled, setVatEnabled] = useState(false)
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const getDefaultExpiry = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}
const [expiryDate, setExpiryDate] = useState(getDefaultExpiry())

  const [itemSuggestions, setItemSuggestions] = useState<any[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setCurrencyCode(profileData.currency_code || 'USD')
        setCurrencySymbol(profileData.currency_symbol || '$')
        setVatRate(profileData.default_vat_rate || 0)
      }

      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (clientsData) setClients(clientsData)
    }
    loadData()
  }, [])

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone?.includes(clientSearch) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    const qty = parseFloat(updated[index].quantity) || 0
    const price = parseFloat(updated[index].unit_price) || 0
    updated[index].line_total = qty * price
    setItems(updated)
  }

  const addItem = () => {
    setItems([...items, { name: '', item_type: 'product', quantity: '', unit_price: '', line_total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const vatAmount = vatEnabled ? (subtotal * vatRate) / 100 : 0
  const total = subtotal + vatAmount

  const searchItems = async (query: string, index: number) => {
    setActiveItemIndex(index)
    if (!query) { setItemSuggestions([]); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('items_directory')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .limit(5)
    setItemSuggestions(data || [])
  }

  const selectSuggestedItem = (suggestion: any, index: number) => {
    const updated = [...items]
    const price = suggestion.default_unit_price.toString()
    updated[index] = {
      ...updated[index],
      name: suggestion.name,
      item_type: suggestion.type,
      unit_price: price,
      line_total: (parseFloat(updated[index].quantity) || 1) * suggestion.default_unit_price,
    }
    setItems(updated)
    setItemSuggestions([])
    setActiveItemIndex(null)
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.currency_code === e.target.value)
    if (selected) {
      setCurrencyCode(selected.currency_code)
      setCurrencySymbol(selected.currency_symbol)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let clientId = selectedClient?.id

    if (isNewClient) {
      if (!newClient.name || !newClient.phone) {
        setError('Client name and phone are required')
        setLoading(false)
        return
      }
      const { data: savedClient } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single()
      if (savedClient) clientId = savedClient.id
    }

    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'quote')

    const quoteNumber = `QUO-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id: clientId,
        quote_number: quoteNumber,
        type: 'quote',
        status: 'sent',
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        vat_rate: vatEnabled ? vatRate : 0,
        subtotal,
        vat_amount: vatAmount,
        total,
        notes,
        issue_date: issueDate,
        expiry_date: expiryDate || null,
      })
      .select()
      .single()

    if (quoteError) {
      setError(quoteError.message)
      setLoading(false)
      return
    }

    const validItems = items.filter(item => item.name)
    const quoteItems = validItems.map(item => ({
      quote_id: quote.id,
      name: item.name,
      item_type: item.item_type,
      quantity: parseFloat(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
      line_total: item.line_total,
    }))

    const newItemsToSave = validItems.filter(item => {
      return !clients.some(c => c.name.toLowerCase() === item.name.toLowerCase())
    })

    await Promise.all([
      supabase.from('quote_items').insert(quoteItems),
      ...newItemsToSave.map(item =>
        supabase.from('items_directory').upsert({
          user_id: user.id,
          name: item.name.trim(),
          type: item.item_type,
          default_unit_price: parseFloat(item.unit_price) || 0,
        }, { onConflict: 'user_id,name' })
      )
    ])

    setLoading(false)
    router.push(`/documents/${quote.id}`)
  }

  const stepOneValid = selectedClient || (isNewClient && newClient.name && newClient.phone)
  const stepTwoValid = items.some(i => i.name && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) > 0)

  const uniqueCurrencies = Array.from(
    new Map(countries.map(c => [c.currency_code, c])).values()
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-gray-500 text-lg">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">New Quote</h1>
          <p className="text-xs text-gray-400">Step {step} of 3</p>
        </div>
      </div>

      <div className="flex px-6 pt-4 gap-2 mb-6">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="px-6">
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Client details</h2>

            {!isNewClient && (
              <>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search existing clients..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white mb-3"
                />

                {clientSearch && filteredClients.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setClientSearch(c.name) }}
                        className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-green-800">{selectedClient.name}</p>
                    <p className="text-xs text-green-600">{selectedClient.phone}</p>
                    {selectedClient.email && <p className="text-xs text-green-600">{selectedClient.email}</p>}
                    <button
                      onClick={() => { setSelectedClient(null); setClientSearch('') }}
                      className="text-xs text-red-400 mt-2 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsNewClient(true)}
                  className="w-full border border-dashed border-gray-300 text-gray-500 py-3 rounded-xl text-sm"
                >
                  + Add new client
                </button>
              </>
            )}

            {isNewClient && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="+27 123 456 789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="Client address"
                  />
                </div>
                <button
                  onClick={() => { setIsNewClient(false); setSelectedClient(null); setClientSearch('') }}
                  className="text-sm text-gray-500 underline"
                >
                  Search existing clients instead
                </button>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!stepOneValid}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50 mt-6"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Items</h2>

            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                <select
                  value={currencyCode}
                  onChange={handleCurrencyChange}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white text-sm"
                >
                  {uniqueCurrencies.map(c => (
                    <option key={c.currency_code} value={c.currency_code}>
                      {c.currency_code} ({c.currency_symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">VAT</label>
                <button
                  onClick={() => setVatEnabled(!vatEnabled)}
                  className={`w-full px-4 py-2 rounded-xl border text-sm font-medium ${vatEnabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  {vatEnabled ? `VAT ${vatRate}% on` : 'VAT off'}
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {items.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-gray-500">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(index)} className="text-red-400 text-xs">Remove</button>
                    )}
                  </div>

                  <div className="mb-3 relative">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => { updateItem(index, 'name', e.target.value); searchItems(e.target.value, index) }}
                      placeholder="Item name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                    />
                    {activeItemIndex === index && itemSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden shadow-sm">
                        {itemSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => selectSuggestedItem(s, index)}
                            className="w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 text-sm"
                          >
                            <span className="font-medium text-gray-900">{s.name}</span>
                            <span className="text-gray-400 ml-2">{currencySymbol}{s.default_unit_price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <select
                      value={item.item_type}
                      onChange={e => updateItem(index, 'item_type', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm bg-white"
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        onFocus={e => e.target.select()}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit price</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                        onFocus={e => e.target.select()}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="text-right text-sm font-medium text-gray-900">
                    {currencySymbol} {item.line_total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="w-full border border-dashed border-gray-300 text-gray-500 py-3 rounded-xl text-sm mb-4"
            >
              + Add another item
            </button>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>{currencySymbol} {subtotal.toFixed(2)}</span>
              </div>
              {vatEnabled && (
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>VAT ({vatRate}%)</span>
                  <span>{currencySymbol} {vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>{currencySymbol} {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!stepTwoValid}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Review quote</h2>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-lg font-bold text-gray-900">{profile?.business_name}</p>
                  <p className="text-xs text-gray-500">{profile?.phone}</p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">QUOTE</span>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Bill to</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedClient?.name || newClient.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedClient?.phone || newClient.phone}
                </p>
                {(selectedClient?.email || newClient.email) && (
                  <p className="text-xs text-gray-500">{selectedClient?.email || newClient.email}</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex gap-4 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Issue date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Expiry date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.name).map((item, index) => (
                      <tr key={index} className="border-t border-gray-50">
                        <td className="py-2 text-gray-900">{item.name}</td>
                        <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-600">{currencySymbol}{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="py-2 text-right text-gray-900 font-medium">{currencySymbol}{item.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal</span>
                  <span>{currencySymbol} {subtotal.toFixed(2)}</span>
                </div>
                {vatEnabled && (
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>VAT ({vatRate}%)</span>
                    <span>{currencySymbol} {vatAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
                  <span>Total</span>
                  <span>{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 text-sm"
                placeholder="Any additional notes for the client..."
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save quote'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}