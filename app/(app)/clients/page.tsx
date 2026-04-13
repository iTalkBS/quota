'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadClients = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (data) setClients(data)
      setLoading(false)
    }
    loadClients()
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>

      <div className="px-6 py-4">
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">
              {search ? 'No clients found' : 'No clients yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                    {client.phone && <p className="text-xs text-gray-500 mt-1">{client.phone}</p>}
                    {client.email && <p className="text-xs text-gray-500">{client.email}</p>}
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/clients/new"
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
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Documents</span>
        </Link>
        <Link href="/clients" className="flex flex-col items-center gap-1">
          <span className="text-green-600 text-xl">◻</span>
          <span className="text-xs font-medium text-green-600">Clients</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xl">◻</span>
          <span className="text-xs text-gray-400">Settings</span>
        </Link>
      </nav>
    </div>
  )
}