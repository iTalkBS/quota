import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  badge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '6 12',
    borderRadius: 20,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  badgeInvoice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '6 12',
    borderRadius: 20,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  clientName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  dateBlock: {
    flexDirection: 'column',
  },
  dateLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowText: {
    fontSize: 9,
    color: '#374151',
  },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: 9,
    color: '#374151',
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: 200,
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  notes: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  quoteNumber: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('id')

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: quote }, { data: profile }, { data: items }] = await Promise.all([
      supabase.from('quotes').select('*').eq('id', quoteId).single(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('quote_items').select('*').eq('quote_id', quoteId),
    ])

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    let client = null
    if (quote.client_id) {
      const { data } = await supabase.from('clients').select('*').eq('id', quote.client_id).single()
      client = data
    }

    const isInvoice = quote.type === 'invoice'

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View>
              <Text style={styles.businessName}>{profile?.business_name || 'My Business'}</Text>
              {profile?.phone && <Text style={styles.businessDetail}>{profile.phone}</Text>}
              {profile?.email && <Text style={styles.businessDetail}>{profile.email}</Text>}
              {profile?.address && <Text style={styles.businessDetail}>{profile.address}</Text>}
            </View>
            <View>
              <Text style={isInvoice ? styles.badgeInvoice : styles.badge}>
                {isInvoice ? 'INVOICE' : 'QUOTE'}
              </Text>
              <Text style={[styles.quoteNumber, { marginTop: 8 }]}>{quote.quote_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {client && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionLabel}>Bill to</Text>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
              {client.email && <Text style={styles.clientDetail}>{client.email}</Text>}
              {client.address && <Text style={styles.clientDetail}>{client.address}</Text>}
            </View>
          )}

          <View style={styles.dateRow}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>Issue date</Text>
              <Text style={styles.dateValue}>{quote.issue_date}</Text>
            </View>
            {quote.expiry_date && (
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Expiry date</Text>
                <Text style={styles.dateValue}>{quote.expiry_date}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colName]}>Item</Text>
              <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit price</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>
            {(items || []).map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableRowText, styles.colName]}>{item.name}</Text>
                <Text style={[styles.tableRowText, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableRowText, styles.colPrice]}>
                  {quote.currency_symbol}{Number(item.unit_price).toFixed(2)}
                </Text>
                <Text style={[styles.tableRowText, styles.colTotal]}>
                  {quote.currency_symbol}{Number(item.line_total).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {quote.currency_symbol}{Number(quote.subtotal).toFixed(2)}
              </Text>
            </View>
            {Number(quote.vat_rate) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT ({quote.vat_rate}%)</Text>
                <Text style={styles.totalsValue}>
                  {quote.currency_symbol}{Number(quote.vat_amount).toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {quote.currency_symbol}{Number(quote.total).toFixed(2)}
              </Text>
            </View>
          </View>

          {quote.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Generated by Qouta</Text>
            <Text style={styles.footerText}>{profile?.phone || ''}</Text>
          </View>
        </Page>
      </Document>
    )

    const pdfStream = await renderToBuffer(doc)

    return new NextResponse(pdfStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quote_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}