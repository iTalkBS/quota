'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Item = { id: string; name: string; description: string; type: string; default_unit_price: number }
type ItemForm = { name: string; description: string; type: string; default_unit_price: string }

const emptyForm: ItemForm = { name: '', description: '', type: 'product', default_unit_price: '' }

export default function ItemsDirectoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<ItemForm>(emptyForm)
  const [editItem, setEditItem] = useState<ItemForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      userIdRef.current = user.id
      const { data } = await supabase
        .from('items_directory')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
      if (data) setItems(data)
      setLoading(false)
    }
    init()
  }, [])

  const reload = async () => {
    const uid = userIdRef.current
    if (!uid) return
    const { data } = await supabase
      .from('items_directory')
      .select('*')
      .eq('user_id', uid)
      .order('name')
    if (data) setItems(data)
  }

  const handleAdd = async () => {
    const uid = userIdRef.current
    if (!uid) { setError('Session expired. Please refresh the page.'); return }
    if (!newItem.name) { setError('Item name is required'); return }
    setSaving(true)
    setError('')
    const { error: e } = await supabase.from('items_directory').insert({
      user_id: uid,
      name: newItem.name.trim(),
      description: newItem.description,
      type: newItem.type,
      default_unit_price: parseFloat(newItem.default_unit_price) || 0,
    })
    if (e) {
      setError(e.message)
    } else {
      setNewItem(emptyForm)
      setShowAdd(false)
      await reload()
    }
    setSaving(false)
  }

  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditItem({
      name: item.name,
      description: item.description || '',
      type: item.type,
      default_unit_price: item.default_unit_price.toString(),
    })
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    await supabase.from('items_directory').update({
      name: editItem.name.trim(),
      description: editItem.description,
      type: editItem.type,
      default_unit_price: parseFloat(editItem.default_unit_price) || 0,
    }).eq('id', editingId)
    setEditingId(null)
    await reload()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('items_directory').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="q-page">
      <div className="q-topbar">
        <button className="q-back-btn" onClick={() => router.back()}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="q-topbar-title">Items directory</div>
        <div style={{ width: 34 }}/>
      </div>

      <div className="q-scroll">
        <div className="q-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#a8a5c0" strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke="#a8a5c0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>

        {showAdd && (
          <div className="q-card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>New item</div>
            {error && <div className="q-error">{error}</div>}
            <div className="q-form-group">
              <label className="q-label">Name <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                className="q-input"
                value={newItem.name}
                onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Item name"
                autoFocus
              />
            </div>
            <div className="q-form-group">
              <label className="q-label">Description</label>
              <input
                className="q-input"
                value={newItem.description}
                onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div className="q-form-group">
              <label className="q-label">Type</label>
              <select
                className="q-select"
                value={newItem.type}
                onChange={e => setNewItem(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="q-form-group">
              <label className="q-label">Default unit price (selling price)</label>
              <input
                className="q-input"
                type="number"
                value={newItem.default_unit_price}
                onChange={e => setNewItem(prev => ({ ...prev, default_unit_price: e.target.value }))}
                onFocus={e => e.target.select()}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowAdd(false); setError(''); setNewItem(emptyForm) }}
                className="q-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newItem.name}
                className="q-btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? 'Saving...' : 'Add item'}
              </button>
            </div>
          </div>
        )}

        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            style={{ width: '100%', background: 'none', border: '2px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 14, fontWeight: 600, color: 'var(--purple)', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="#6c47ff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add new item
          </button>
        )}

        {loading ? (
          <div className="q-loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="q-empty">
            <div className="q-empty-title">{search ? 'No items found' : 'No items yet'}</div>
            <div className="q-empty-sub">{search ? 'Try a different search' : 'Add items to reuse them quickly when creating quotes'}</div>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="q-item-card">
              {editingId === item.id ? (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Edit item</div>
                  <div className="q-form-group">
                    <label className="q-label">Name</label>
                    <input
                      className="q-input"
                      value={editItem.name}
                      onChange={e => setEditItem(prev => ({ ...prev, name: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Description</label>
                    <input
                      className="q-input"
                      value={editItem.description}
                      onChange={e => setEditItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Type</label>
                    <select
                      className="q-select"
                      value={editItem.type}
                      onChange={e => setEditItem(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </select>
                  </div>
                  <div className="q-form-group">
                    <label className="q-label">Default unit price (selling price)</label>
                    <input
                      className="q-input"
                      type="number"
                      value={editItem.default_unit_price}
                      onChange={e => setEditItem(prev => ({ ...prev, default_unit_price: e.target.value }))}
                      onFocus={e => e.target.select()}
                      min="0"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setEditingId(null)} className="q-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={handleSaveEdit} disabled={saving || !editItem.name} className="q-btn-primary" style={{ flex: 1 }}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.description}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: item.type === 'product' ? 'var(--purple-bg)' : 'var(--green-bg)', color: item.type === 'product' ? 'var(--purple)' : 'var(--green)' }}>
                        {item.type}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {Number(item.default_unit_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(item)} className="q-icon-btn" style={{ background: 'var(--purple-bg)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="#6c47ff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="q-icon-btn" style={{ background: 'var(--red-bg)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M4.5 3.5V2.5h5v1M5.5 6v4M8.5 6v4M3 3.5l.8 8h6.4l.8-8" stroke="#ff4060" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}