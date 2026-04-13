'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ClientsPage() {
  const [search, setSearch] = useState('')

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

        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-gray-400 text-sm">No clients yet</p>
        </div>
      </div>

      <button className="fixed bottom-20 right-6 bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg">
        +
      </button>

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