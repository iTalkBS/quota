'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [client, setClient] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadClient = async () => {
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single()

      if (clientData) {
        setClient(clientData)
        setName(clientData.name)
        setPhone(clientData.phone || '')
        setEmail(clientData.email || '')
        setAddress(clientData.address || '')
      }

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', params.id)
        .order('created_at', { ascending: false })

      if (quotesData) setQuotes(quotesData)
      setLoading(false)
    }
    loadClient()
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    await supabase
      .from('clients')
      .update({ name, phone, email, address })
      .eq('id', params.id)
    setClient({ ...client, name, phone, email, address })
    setSaving(false)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this client? Their quotes will not be deleted.')) return
    await supabase.from('clients').delete().eq('id', params.id)
    router.push('/clients')
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'unpaid': return 'bg-amber-100 text-amber-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'converted': return 'bg-purple-100 text-purple-700'
      case 'sent': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Client not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 text-lg">←</button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{client.name}</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="text-green-600 text-sm font-medium"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="px-6 py-6 space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Client details</h2>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {client.phone && (
                <div className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16">Phone</span>
                  <span className="text-sm text-gray-900">{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16">Email</span>
                  <span className="text-sm text-gray-900">{client.email}</span>
                </div>
              )}
              {client.address && (
                <div className="flex gap-3">
                  <span className="text-xs text-gray-400 w-16">Address</span>
                  <span className="text-sm text-gray-900">{client.address}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Documents ({quotes.length})
          </h2>
          {quotes.length === 0 ? (
            <p className="text-sm text-gray-400">No documents yet</p>
          ) : (
            <div className="space-y-2">
              {quotes.map(quote => (
                <Link
                  key={quote.id}
                  href={`/documents/${quote.id}`}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{quote.quote_number}</p>
                    <p className="text-xs text-gray-400">{quote.issue_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusStyle(quote.status)}`}>
                      {quote.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {quote.currency_symbol}{Number(quote.total).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="w-full border border-red-200 text-red-500 py-3 rounded-xl font-medium text-base"
        >
          Delete client
        </button>
      </div>
    </div>
  )
}