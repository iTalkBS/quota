'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Quote = {
  id: string
  quote_number: string
  type: string
  status: string
  total: number
  currency_symbol: string
  issue_date: string
  client_id: string
}

type Client = {
  id: string
  name: string
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices'>('quotes')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: quotesData }, { data: clientsData }] = await Promise.all([
        supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id),
      ])

      if (quotesData) setQuotes(quotesData)
      if (clientsData) setClients(clientsData)
      setLoading(false)
    }
    loadData()
  }, [])

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown client'
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'unpaid': return 'bg-amber-100 text-amber-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'converted': return 'bg-purple-100 text-purple-700'
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'accepted': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filtered = quotes.filter(q => {
    const matchesTab = activeTab === 'quotes' ? q.type === 'quote' : q.type === 'invoice'
    const clientName = getClientName(q.client_id).toLowerCase()
    const matchesSearch = search === '' ||
      clientName.includes(search.toLowerCase()) ||
      q.quote_number.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
      </div>

      <div className="px-6 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              activeTab === 'quotes'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Quotes
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${
              activeTab === 'invoices'
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            Invoices
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name or number..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No {activeTab} yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quote => (
              <Link
                key={quote.id}
                href={`/documents/${quote.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getClientName(quote.client_id)}
                    </p>
                    <p className="text-xs text-gray-400">{quote.quote_number}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusStyle(quote.status)}`}>
                    {quote.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">{quote.issue_date}</p>
                  <p className="text-sm font-bold text-gray-900">
                    {quote.currency_symbol} {Number(quote.total).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/documents/new"
        className="fixed bottom-20 right-6 bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
      >
        +
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">⊞</span>
          <span className="text-xs text-gray-400">Dashboard</span>
        </Link>
        <Link href="/documents" className="flex flex-col items-center gap-1">
          <span className="text-green-600 text-xl">◻</span>
          <span className="text-xs font-medium text-green-600">Documents</span>
        </Link>
        <Link href="/clients" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Clients</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Settings</span>
        </Link>
      </nav>
    </div>
  )
}