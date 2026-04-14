'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'
import { clearCache } from '@/lib/cache'

type Item = { id?: string; name: string; description: string; item_type: 'product' | 'service'; quantity: string; unit_price: string; line_total: number }
type Client = { id: string; name: string; email: string; phone: string; address: string }

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [docType, setDocType] = useState('quote')
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isNewClient, setIsNewClient] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' })
  const [items, setItems] = useState<Item[]>([])
  const [currencyCode, setCurrencyCode] = useState('USD')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [vatRate, setVatRate] = useState(0)
  const [vatEnabled, setVatEnabled] = useState(false)
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([])
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: q }, { data: i }, { data: c }] = await Promise.all([
        supabase.from('quotes').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('quote_items').select('*').eq('quote_id', params.id),
        supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
      ])

      if (q) {
        setDocType(q.type)
        setCurrencyCode(q.currency_code)
        setCurrencySymbol(q.currency_symbol)
        setVatRate(q.vat_rate || 0)
        setVatEnabled(q.vat_rate > 0)
        setNotes(q.notes || '')
        setIssueDate(q.issue_date || '')
        setExpiryDate(q.expiry_date || '')
        setDueDate(q.due_date || '')
        if (q.client_id && c) {
          const existing = c.find((cl: Client) => cl.id === q.client_id)
          if (existing) {
            setSelectedClient(existing)
            setClientSearch(existing.name)
          }
        }
      }

      if (i && i.length > 0) {
        setItems(i.map((item: any) => ({
          id: item.id,
          name: item.name || '',
          description: item.description || '',
          item_type: item.item_type || 'product',
          quantity: String(item.quantity ?? 1),
          unit_price: String(item.unit_price ?? 0),
          line_total: Number(item.line_total ?? 0),
        })))
      } else {
        setItems([{ name: '', description: '', item_type: 'product', quantity: '1', unit_price: '', line_total: 0 }])
      }

      if (c) setClients(c)
      setLoading(false)
    }
    load()
  }, [params.id])

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
    if (!userId) return
    const { data } = await supabase
      .from('items_directory')
      .select('*')
      .eq('user_id', userId)
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

  const handleSave = async () => {
    setSaving(true)
    setError('')
    if (!userId) return

    let clientId = selectedClient?.id
    if (isNewClient) {
      if (!newClient.name || !newClient.phone) {
        setError('Client name and phone are required')
        setSaving(false)
        return
      }
      const { data: saved } = await supabase
        .from('clients')
        .insert({ ...newClient, user_id: userId })
        .select()
        .single()
      if (saved) clientId = saved.id
    }

    await supabase.from('quotes').update({
      client_id: clientId,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      vat_rate: vatEnabled ? vatRate : 0,
      subtotal,
      vat_amount: vatAmount,
      total,
      notes,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
      due_date: dueDate || null,
    }).eq('id', params.id)

    await supabase.from('quote_items').delete().eq('quote_id', params.id)

    const validItems = items.filter(i => i.name)
    if (validItems.length > 0) {
      await supabase.from('quote_items').insert(
        validItems.map(i => ({
          quote_id: params.id,
          name: i.name,
          description: i.description || '',
          item_type: i.item_type,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          line_total: i.line_total,
        }))
      )
    }

    clearCache('dashboard')
    clearCache('documents')
    router.push(`/documents/${params.id}`)
  }

  const uniqueCurrencies = Array.from(new Map(countries.map(c => [c.currency_code, c])).values())
  const isInvoice = docType === 'invoice'

  if (loading) return <div className="q-page"><div className="q-loading">Loading...</div></div>

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">Edit {isInvoice ? 'invoice' : 'quote'}</div>
        <div style={{ width: 34 }}/>
      </div>

      <div className="q-scroll">
        {error && <div className="q-error">{error}</div>}

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Client</div>

          {!isNewClient && (
            <>
              <div className="q-search" style={{ marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="#a8a5c0" strokeWidth="1.5"/>
                  <path d="M11 11l3 3" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..."/>
                {clientSearch && (
                  <button onClick={() => { setClientSearch(''); setSelectedClient(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                )}
              </div>

              {clientSearch && filteredClients.length > 0 && !selectedClient && (
                <div style={{ background: 'var(--white)', border: '1.5px solid var(--border2)', borderRadius: 'var(--radius-sm)', marginBottom: 10, overflow: 'hidden' }}>
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name) }}
                      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.phone}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,194,122,0.2)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{selectedClient.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--green)', opacity: 0.8, marginTop: 2 }}>{selectedClient.phone}</div>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClientSearch('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                </div>
              )}

              <button onClick={() => setIsNewClient(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', fontWeight: 600, padding: 0 }}>
                + Add new client instead
              </button>
            </>
          )}

          {isNewClient && (
            <>
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
              <button onClick={() => { setIsNewClient(false); setNewClient({ name: '', email: '', phone: '', address: '' }) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--purple)', fontWeight: 600, padding: 0 }}>
                ← Search existing clients
              </button>
            </>
          )}
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Dates</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label className="q-label">Issue date</label>
              <input className="q-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}/>
            </div>
            {isInvoice ? (
              <div style={{ flex: 1 }}>
                <label className="q-label">Payment due date</label>
                <input className="q-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}/>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <label className="q-label">Expiry date</label>
                <input className="q-input" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}/>
              </div>
            )}
          </div>
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Currency and VAT</div>
          <div style={{ display: 'flex', gap: 10 }}>
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
                style={{ width: '100%', padding: '13px 14px', borderRadius: 'var(--radius-xs)', border: '1.5px solid', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: vatEnabled ? 'var(--purple-bg)' : 'var(--bg)', borderColor: vatEnabled ? 'var(--purple)' : 'var(--border2)', color: vatEnabled ? 'var(--purple)' : 'var(--text3)' }}
              >
                {vatEnabled ? `VAT ${vatRate}%` : 'VAT off'}
              </button>
            </div>
          </div>
        </div>

        <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Items</div>

          {items.map((item, index) => (
            <div key={index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
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

          <button
            onClick={() => setItems([...items, { name: '', description: '', item_type: 'product', quantity: '1', unit_price: '', line_total: 0 }])}
            style={{ width: '100%', background: 'none', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 14, fontWeight: 600, color: 'var(--purple)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/></svg>
            Add item
          </button>

          <div style={{ marginTop: 16, padding: '14px 0 0', borderTop: '1px solid var(--border)' }}>
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

        <div className="q-card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Notes</div>
          <textarea
            className="q-textarea"
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="q-btn-primary"
          style={{ marginBottom: 20 }}
        >
          {saving ? 'Saving...' : `Save ${isInvoice ? 'invoice' : 'quote'}`}
        </button>
      </div>
    </div>
  )
}