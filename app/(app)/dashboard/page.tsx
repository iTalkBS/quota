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

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: quotesData }, { data: clientsData }, { data: profileData }] = await Promise.all([
        supabase
          .from('quotes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
      ])

      if (quotesData) setQuotes(quotesData)
      if (clientsData) setClients(clientsData)
      if (profileData) setProfile(profileData)
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
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const totalQuotes = quotes.filter(q => q.type === 'quote').length
  const unpaidInvoices = quotes.filter(q => q.type === 'invoice' && q.status === 'unpaid')
  const unpaidTotal = unpaidInvoices.reduce((sum, q) => sum + Number(q.total), 0)
  const unpaidSymbol = unpaidInvoices[0]?.currency_symbol || '$'

  const recentQuotes = quotes.filter(q => q.type === 'quote').slice(0, 3)
  const recentInvoices = quotes.filter(q => q.type === 'invoice').slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Qouta</h1>
        <p className="text-sm text-gray-500">
          {profile?.business_name || 'Welcome back'}
        </p>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center mb-6">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Total quotes</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuotes}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500">Unpaid invoices</p>
                <p className="text-2xl font-bold text-gray-900">{unpaidInvoices.length}</p>
                {unpaidInvoices.length > 0 && (
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {unpaidSymbol} {unpaidTotal.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/documents/new"
              className="block w-full bg-green-600 text-white py-4 rounded-2xl font-medium text-center text-base mb-6"
            >
              + New Quote
            </Link>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent quotes</h2>
                <Link href="/documents" className="text-sm text-green-600">See all</Link>
              </div>
              {recentQuotes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-400 text-sm">No quotes yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuotes.map(quote => (
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

            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent invoices</h2>
                <Link href="/documents" className="text-sm text-green-600">See all</Link>
              </div>
              {recentInvoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-400 text-sm">No invoices yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map(quote => (
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
          </>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around">
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <span className="text-green-600 text-xl">⊞</span>
          <span className="text-xs font-medium text-green-600">Dashboard</span>
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
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Settings</span>
        </Link>
      </nav>
    </div>
  )
}