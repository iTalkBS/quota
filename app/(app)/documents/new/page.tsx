'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'
import { clearCache, getCached } from '@/lib/cache'

type Client = { id: string; name: string; email: string; phone: string; address: string }
type Item = { name: string; description: string; item_type: 'product' | 'service'; quantity: string; unit_price: string; line_total: number }
type Profile = { business_name: string; currency_code: string; currency_symbol: string; default_vat_rate: number; phone: string; email: string; address: string }

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
  const [items, setItems] = useState<Item[]>([{ name: '', description: '', item_type: 'product', quantity: '1', unit_price: '', line_total: 0 }])
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [vatRate, setVatRate] = useState(0)
  const [vatEnabled, setVatEnabled] = useState(false)
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
      ])
      if (p) {
        setProfile(p)
        setCurrencyCode(p.currency_code || 'USD')
        setCurrencySymbol(p.currency_symbol || '$')
        setVatRate(Number(p.default_vat_rate) || 0)
        if (Number(p.default_vat_rate) > 0) setVatEnabled(true)
      }
      if (c) setClients(c)
      const cachedDocs = getCached('documents')
      if (cachedDocs?.clients) setClients(cachedDocs.clients)
      setPageLoading(false)
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

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
  const vatAmount = vatEnabled ? (subtotal * vatRate) / 100 : 0
  const total = subtotal + vatAmount

  const searchItems = async (query: string, index: number) => {
    setActiveItemIndex(index)
    if (!query) { setItemSuggestions([]); return }
    const uid = profile ? (await supabase.auth.getUser()).data.user?.id : null
    if (!uid) return
    const { data } = await supabase
      .from('items_directory')
      .select('*')
      .eq('user_id', uid)
      .ilike('name', `%${query}%`)
      .limit(10)
    setItemSuggestions(data || [])
  }

  const selectSuggestedItem = (suggestion: any, index: number) => {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      name: suggestion.name,
      description: suggestion.description || '',
      item_type: suggestion.type,
      unit_price: suggestion.default_unit_price.toString(),
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
      const { data: saved } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: user.id })
        .select()
        .single()
      if (saved) clientId = saved.id
    }

    const { data: numberData } = await supabase
      .rpc('get_next_quote_number', { uid: user.id, doc_type: 'quote' })

    const quoteNumber = numberData || `QUO-${new Date().getFullYear()}-${Date.now()}`

    const { data: quote, error: qe } = await supabase
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

    if (qe) { setError(qe.message); setLoading(false); return }

    const validItems = items.filter(i => i.name)
    await Promise.all([
      supabase.from('quote_items').insert(
        validItems.map(i => ({
          quote_id: quote.id,
          name: i.name,
          description: i.description || '',
          item_type: i.item_type,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          line_total: i.line_total,
        }))
      ),
      ...validItems.map(i =>
        supabase.from('items_directory').upsert({
          user_id: user.id,
          name: i.name.trim(),
          type: i.item_type,
          default_unit_price: parseFloat(i.unit_price) || 0,
          description: i.description || '',
        }, { onConflict: 'user_id,name' })
      )
    ])

    clearCache('dashboard')
    clearCache('documents')
    router.push(`/documents/${quote.id}`)
  }

  const stepOneValid = selectedClient || (isNewClient && newClient.name && newClient.phone)
  const stepTwoValid = items.some(i => i.name && parseFloat(i.quantity) > 0 && parseFloat(i.unit_price) > 0)
  const uniqueCurrencies = Array.from(new Map(countries.map(c => [c.currency_code, c])).values())

if (pageLoading) return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">New Quote</div>
        <div style={{ width: 34 }}/>
      </div>
      <div className="q-scroll">
        <div className="q-skeleton-card" style={{ marginBottom: 12 }}>
          <div className="q-skeleton" style={{ width: 120, height: 14, marginBottom: 16 }}/>
          <div className="q-skeleton" style={{ width: '100%', height: 48, marginBottom: 10 }}/>
          <div className="q-skeleton" style={{ width: '100%', height: 48, marginBottom: 10 }}/>
          <div className="q-skeleton" style={{ width: '100%', height: 48 }}/>
        </div>
      </div>
    </div>
  )

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">New Quote</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Step {step}/3</div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        <div className="q-progress-bar">
          {[1,2,3].map(s => (
            <div key={s} className={`q-progress-step ${s <= step ? 'active' : ''}`}/>
          ))}
        </div>
      </div>

      <div className="q-scroll">
        {step === 1 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Client details</div>

            {!isNewClient && (
              <>
                <div className="q-search" style={{ marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="#a8a5c0" strokeWidth="1.5"/>
                    <path d="M11 11l3 3" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search existing clients..."
                  />
                  {clientSearch && (
                    <button
                      onClick={() => { setClientSearch(''); setSelectedClient(null) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: 0 }}
                    >×</button>
                  )}
                </div>

                {clientSearch && filteredClients.length > 0 && (
                  <div style={{ background: 'var(--white)', border: '1.5px solid var(--border2)', borderRadius: 'var(--radius-sm)', marginBottom: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setClientSearch(c.name) }}
                        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.phone}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,194,122,0.2)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{selectedClient.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--green)', opacity: 0.8, marginTop: 2 }}>{selectedClient.phone}</div>
                      </div>
                      <button
                        onClick={() => { setSelectedClient(null); setClientSearch('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 18, lineHeight: 1, padding: 0 }}
                      >×</button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsNewClient(true)}
                  style={{ width: '100%', background: 'none', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 14, fontWeight: 600, color: 'var(--purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add new client
                </button>
              </>
            )}

            {isNewClient && (
              <div className="q-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>New client</div>
                <div className="q-form-group">
                  <label className="q-label">Name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="q-input" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client name"/>
                </div>
                <div className="q-form-group">
                  <label className="q-label">Phone <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="q-input" type="tel" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="+27 123 456 789"/>
                </div>
                <div className="q-form-group">
                  <label className="q-label">Email</label>
                  <input className="q-input" type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="client@example.com"/>
                </div>
                <div className="q-form-group">
                  <label className="q-label">Address</label>
                  <input className="q-input" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} placeholder="Client address"/>
                </div>
                <button
                  onClick={() => { setIsNewClient(false); setSelectedClient(null); setClientSearch('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', fontWeight: 600, padding: 0 }}
                >
                  ← Search existing clients instead
                </button>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!stepOneValid}
              className="q-btn-primary"
              style={{ marginTop: 20 }}
            >
              Next → Items
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Items and pricing</div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label className="q-label">Currency</label>
                <select className="q-select" value={currencyCode} onChange={handleCurrencyChange}>
                  {uniqueCurrencies.map(c => (
                    <option key={c.currency_code} value={c.currency_code}>{c.currency_code} ({c.currency_symbol})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="q-label">VAT</label>
                <button
                  onClick={() => setVatEnabled(!vatEnabled)}
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 'var(--radius-xs)', border: '1.5px solid', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: vatEnabled ? 'var(--purple-bg)' : 'var(--bg)', borderColor: vatEnabled ? 'var(--purple)' : 'var(--border2)', color: vatEnabled ? 'var(--purple)' : 'var(--text3)' }}
                >
                  {vatEnabled ? `VAT ${vatRate}%` : 'VAT off'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              {items.map((item, index) => (
                <div key={index} className="q-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Item {index + 1}</div>
                    {items.length > 1 && (
                      <button
                        onClick={() => setItems(items.filter((_, i) => i !== index))}
                        style={{ background: 'var(--red-bg)', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <input
                      className="q-input"
                      value={item.name}
                      onChange={e => { updateItem(index, 'name', e.target.value); searchItems(e.target.value, index) }}
                      placeholder="Item name"
                    />
                    {activeItemIndex === index && itemSuggestions.length > 0 && (
                      <div className="q-suggestion-list">
                        {itemSuggestions.map((s, i) => (
                          <button key={i} className="q-suggestion-item" onClick={() => selectSuggestedItem(s, index)}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{currencySymbol}{s.default_unit_price}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    className="q-input"
                    style={{ marginBottom: 10 }}
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    placeholder="Description (optional)"
                  />

                  <select
                    className="q-select"
                    style={{ marginBottom: 10 }}
                    value={item.item_type}
                    onChange={e => updateItem(index, 'item_type', e.target.value)}
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label className="q-label">Quantity</label>
                      <input
                        className="q-input"
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        onFocus={e => e.target.select()}
                        placeholder="1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="q-label">Unit price</label>
                      <input
                        className="q-input"
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                        onFocus={e => e.target.select()}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 15, fontWeight: 800, color: 'var(--purple)' }}>
                    {currencySymbol} {item.line_total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setItems([...items, { name: '', description: '', item_type: 'product', quantity: '1', unit_price: '', line_total: 0 }])}
              style={{ width: '100%', background: 'none', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 14, fontWeight: 600, color: 'var(--purple)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/></svg>
              Add another item
            </button>

            <div className="q-card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                <span>Subtotal</span><span>{currencySymbol} {subtotal.toLocaleString()}</span>
              </div>
              {vatEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                  <span>VAT ({vatRate}%)</span><span>{currencySymbol} {vatAmount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                <span>Total</span><span>{currencySymbol} {total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={() => setStep(3)} disabled={!stepTwoValid} className="q-btn-primary">
              Next → Review
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Review quote</div>

            <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{profile?.business_name}</div>
                  {profile?.phone && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{profile.phone}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 20, background: 'var(--purple-bg)', color: 'var(--purple)' }}>QUOTATION</span>
              </div>

              <div className="q-divider"/>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Bill to</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{selectedClient?.name || newClient.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{selectedClient?.phone || newClient.phone}</div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div>
                  <label className="q-label">Issue date</label>
                  <input className="q-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ fontSize: 13 }}/>
                </div>
                <div>
                  <label className="q-label">Expiry date</label>
                  <input className="q-input" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} style={{ fontSize: 13 }}/>
                </div>
              </div>

              <div className="q-divider"/>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Item', 'Qty', 'Price', 'Total'].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '6px 0', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.name).map((item, index) => (
                    <tr key={index} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{item.name}</div>
                        {item.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{item.description}</div>}
                      </td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text2)' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text2)' }}>{currencySymbol}{parseFloat(item.unit_price).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--text)' }}>{currencySymbol}{item.line_total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                  <span>Subtotal</span><span>{currencySymbol} {subtotal.toLocaleString()}</span>
                </div>
                {vatEnabled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                    <span>VAT ({vatRate}%)</span><span>{currencySymbol} {vatAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                  <span>Total</span><span>{currencySymbol} {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="q-form-group">
              <label className="q-label">Notes (optional)</label>
              <textarea
                className="q-textarea"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional notes for the client..."
              />
            </div>

            {error && <div className="q-error">{error}</div>}

            <button onClick={handleSubmit} disabled={loading} className="q-btn-primary" style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
              {loading ? 'Saving...' : 'Save quote'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}