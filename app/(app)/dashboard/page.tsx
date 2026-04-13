'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Qouta</h1>
        <p className="text-sm text-gray-500">Welcome back</p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total quotes</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Unpaid invoices</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <Link
          href="/documents/new"
          className="block w-full bg-green-600 text-white py-4 rounded-2xl font-medium text-center text-base mb-6"
        >
          + New Quote
        </Link>

        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent quotes</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No quotes yet</p>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent invoices</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-gray-400 text-sm">No invoices yet</p>
          </div>
        </div>
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