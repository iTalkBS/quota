'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  name: string
  description: string
  type: string
  default_unit_price: number
}

export default function ItemsDirectoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('product')
  const [editPrice, setEditPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('product')
  const [newPrice, setNewPrice] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
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

  const loadItems = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('items_directory')
      .select('*')
      .eq('user_id', userId)
      .order('name')
    if (data) setItems(data)
  }

  const handleAdd = async () => {
    setSaving(true)
    setError('')
    if (!newName) {
      setError('Item name is required')
      setSaving(false)
      return
    }
    if (!userId) return
    const { error: saveError } = await supabase
      .from('items_directory')
      .insert({
        user_id: userId,
        name: newName.trim(),
        type: newType,
        default_unit_price: parseFloat(newPrice) || 0,
        description: newDescription,
      })
    if (saveError) {
      setError(saveError.message)
    } else {
      setNewName('')
      setNewType('product')
      setNewPrice('')
      setNewDescription('')
      setShowAdd(false)
      loadItems()
    }
    setSaving(false)
  }

  const handleEdit = (item: Item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditType(item.type)
    setEditPrice(item.default_unit_price.toString())
    setEditDescription(item.description || '')
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    await supabase
      .from('items_directory')
      .update({
        name: editName.trim(),
        type: editType,
        default_unit_price: parseFloat(editPrice) || 0,
        description: editDescription,
      })
      .eq('id', editingId)
    setEditingId(null)
    loadItems()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item from your directory?')) return
    await supabase.from('items_directory').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 text-lg">←</button>
        <h1 className="text-lg font-bold text-gray-900">Items directory</h1>
      </div>

      <div className="px-6 py-4 space-y-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
        />

        {showAdd && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Add new item</h2>
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default price</label>
              <input
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                onFocus={e => e.target.select()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="0.00"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save item'}
              </button>
            </div>
          </div>
        )}

        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full border border-dashed border-gray-300 text-gray-500 py-3 rounded-xl text-sm"
          >
            + Add new item
          </button>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">
              {search ? 'No items found' : 'No items yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={editType}
                        onChange={e => setEditType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                      >
                        <option value="product">Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default unit price (selling price)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        onFocus={e => e.target.select()}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{item.type}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400">{item.description}</p>
                      )}
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {Number(item.default_unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-green-600 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}