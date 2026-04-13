'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuote = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)

      const { data: quoteData } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', params.id)
        .single()
      if (quoteData) {
        setQuote(quoteData)
        if (quoteData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('id', quoteData.client_id)
            .single()
          if (clientData) setClient(clientData)
        }
      }

      const { data: itemsData } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', params.id)
      if (itemsData) setItems(itemsData)

      setLoading(false)
    }
    loadQuote()
  }, [params.id])

  const handleWhatsApp = () => {
    if (!client?.phone) return
    const phone = client.phone.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Hello ${client.name},\n\nPlease find attached your ${quote.type === 'quote' ? 'quotation' : 'invoice'} ${quote.quote_number} from ${profile?.business_name}.\n\nTotal: ${quote.currency_symbol} ${quote.total.toFixed(2)}\n\nThank you for your business.`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleConvertToInvoice = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'invoice')

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    const { data: invoice } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id: quote.client_id,
        quote_number: invoiceNumber,
        type: 'invoice',
        status: 'unpaid',
        currency_code: quote.currency_code,
        currency_symbol: quote.currency_symbol,
        vat_rate: quote.vat_rate,
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        total: quote.total,
        notes: quote.notes,
        issue_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (invoice) {
      const invoiceItems = items.map(item => ({
        quote_id: invoice.id,
        name: item.name,
        description: item.description,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }))
      await supabase.from('quote_items').insert(invoiceItems)

      await supabase
        .from('quotes')
        .update({ status: 'converted' })
        .eq('id', quote.id)

      router.push(`/documents/${invoice.id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Quote not found</p>
      </div>
    )
  }

  const isInvoice = quote.type === 'invoice'

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 text-lg">←</button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{quote.quote_number}</h1>
          <p className="text-xs text-gray-400">{isInvoice ? 'Invoice' : 'Quote'}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            quote.status === 'paid' ? 'bg-green-100 text-green-700' :
            quote.status === 'unpaid' ? 'bg-amber-100 text-amber-700' :
            quote.status === 'overdue' ? 'bg-red-100 text-red-700' :
            quote.status === 'converted' ? 'bg-purple-100 text-purple-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {quote.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-lg font-bold text-gray-900">{profile?.business_name}</p>
              <p className="text-xs text-gray-500">{profile?.phone}</p>
              <p className="text-xs text-gray-500">{profile?.email}</p>
              {profile?.address && <p className="text-xs text-gray-500">{profile?.address}</p>}
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isInvoice ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {isInvoice ? 'INVOICE' : 'QUOTE'}
            </span>
          </div>

          {client && (
            <div className="border-t border-gray-100 pt-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Bill to</p>
              <p className="text-sm font-medium text-gray-900">{client.name}</p>
              <p className="text-xs text-gray-500">{client.phone}</p>
              {client.email && <p className="text-xs text-gray-500">{client.email}</p>}
              {client.address && <p className="text-xs text-gray-500">{client.address}</p>}
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 mb-3">
            <div className="flex gap-4 text-xs text-gray-500">
              <div>
                <p className="mb-1">Issue date</p>
                <p className="text-gray-900 font-medium">{quote.issue_date}</p>
              </div>
              {quote.expiry_date && (
                <div>
                  <p className="mb-1">Expiry date</p>
                  <p className="text-gray-900 font-medium">{quote.expiry_date}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t border-gray-50">
                    <td className="py-2 text-gray-900">{item.name}</td>
                    <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">{quote.currency_symbol}{item.unit_price.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-900 font-medium">{quote.currency_symbol}{item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Subtotal</span>
              <span>{quote.currency_symbol} {quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.vat_rate > 0 && (
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>VAT ({quote.vat_rate}%)</span>
                <span>{quote.currency_symbol} {quote.vat_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-1">
              <span>Total</span>
              <span>{quote.currency_symbol} {quote.total.toFixed(2)}</span>
            </div>
          </div>

          {quote.notes && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{quote.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-3 mt-3 text-center">
            <p className="text-xs text-gray-400">Generated by Qouta · {profile?.phone}</p>
          </div>
        </div>

        <div className="space-y-3">
          {client?.phone && (
            <button
              onClick={handleWhatsApp}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-medium text-base flex items-center justify-center gap-2"
            >
              Share via WhatsApp
            </button>
          )}

          {!isInvoice && quote.status !== 'converted' && (
            <button
              onClick={handleConvertToInvoice}
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-medium text-base"
            >
              Convert to Invoice
            </button>
          )}

          {isInvoice && quote.status === 'unpaid' && (
            <button
              onClick={async () => {
                await supabase.from('quotes').update({ status: 'paid' }).eq('id', quote.id)
                setQuote({ ...quote, status: 'paid' })
              }}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-base"
            >
              Mark as Paid
            </button>
          )}

          <Link
            href="/documents"
            className="block w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-base text-center"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    </div>
  )
}