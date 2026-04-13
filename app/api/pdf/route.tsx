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
    marginBottom: 24,
  },
  businessName: {
    fontSize: 16,
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
    textAlign: 'center',
  },
  badgeInvoice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '6 12',
    borderRadius: 20,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  quoteNumber: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
    marginTop: 4,
  },
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
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
    backgroundColor: '#f3f4f6',
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '5 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowText: {
    fontSize: 9,
    color: '#374151',
  },
  tableRowSubText: {
    fontSize: 8,
    color: '#9ca3af',
    marginTop: 1,
  },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 2, textAlign: 'right' },
  colTotal: { flex: 2, textAlign: 'right' },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
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
    borderBottomColor: '#d1d5db',
    width: 220,
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  bankingSection: {
    marginBottom: 16,
    padding: '10 12',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bankingTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bankingRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bankingLabel: {
    fontSize: 8,
    color: '#9ca3af',
    width: 100,
  },
  bankingValue: {
    fontSize: 8,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  termsSection: {
    marginBottom: 16,
  },
  termsTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.6,
  },
  notes: {
    marginBottom: 16,
    padding: '8 10',
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  notesLabel: {
    fontSize: 8,
    color: '#92400e',
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 9,
    color: '#78350f',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
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
    const hasBanking = profile?.bank_name || profile?.bank_account_number

    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>

          <View style={styles.header}>
            <View>
              <Text style={styles.businessName}>{profile?.business_name || 'My Business'}</Text>
              {profile?.contact_person && <Text style={styles.businessDetail}>{profile.contact_person}</Text>}
              {profile?.phone && <Text style={styles.businessDetail}>{profile.phone}</Text>}
              {profile?.email && <Text style={styles.businessDetail}>{profile.email}</Text>}
              {profile?.address && <Text style={styles.businessDetail}>{profile.address}</Text>}
              {profile?.registration_number && (
                <Text style={styles.businessDetail}>Reg No: {profile.registration_number}</Text>
              )}
              {profile?.vat_registration_number && (
                <Text style={styles.businessDetail}>VAT Reg No: {profile.vat_registration_number}</Text>
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={isInvoice ? styles.badgeInvoice : styles.badge}>
                {isInvoice ? 'INVOICE' : 'QUOTATION'}
              </Text>
              <Text style={styles.quoteNumber}>{quote.quote_number}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoCol}>
            {client && (
              <View style={styles.col}>
                <Text style={styles.sectionLabel}>Bill to</Text>
                <Text style={styles.clientName}>{client.name}</Text>
                {client.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
                {client.email && <Text style={styles.clientDetail}>{client.email}</Text>}
                {client.address && <Text style={styles.clientDetail}>{client.address}</Text>}
              </View>
            )}
            <View style={[styles.col, { alignItems: 'flex-end' }]}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Issue date</Text>
                <Text style={styles.dateValue}>{quote.issue_date}</Text>
              </View>
              {quote.expiry_date && (
                <View style={[styles.dateBlock, { marginTop: 8 }]}>
                  <Text style={styles.dateLabel}>Valid until</Text>
                  <Text style={styles.dateValue}>{quote.expiry_date}</Text>
                </View>
              )}
            </View>
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
                <View style={styles.colName}>
                  <Text style={styles.tableRowText}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.tableRowSubText}>{item.description}</Text>
                  )}
                </View>
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

          {hasBanking && (
            <View style={styles.bankingSection}>
              <Text style={styles.bankingTitle}>Banking details</Text>
              {profile?.bank_name && (
                <View style={styles.bankingRow}>
                  <Text style={styles.bankingLabel}>Bank</Text>
                  <Text style={styles.bankingValue}>{profile.bank_name}</Text>
                </View>
              )}
              {profile?.bank_account_name && (
                <View style={styles.bankingRow}>
                  <Text style={styles.bankingLabel}>Account name</Text>
                  <Text style={styles.bankingValue}>{profile.bank_account_name}</Text>
                </View>
              )}
              {profile?.bank_account_number && (
                <View style={styles.bankingRow}>
                  <Text style={styles.bankingLabel}>Account number</Text>
                  <Text style={styles.bankingValue}>{profile.bank_account_number}</Text>
                </View>
              )}
              {profile?.bank_branch_code && (
                <View style={styles.bankingRow}>
                  <Text style={styles.bankingLabel}>Branch code</Text>
                  <Text style={styles.bankingValue}>{profile.bank_branch_code}</Text>
                </View>
              )}
              {profile?.bank_swift_code && (
                <View style={styles.bankingRow}>
                  <Text style={styles.bankingLabel}>SWIFT code</Text>
                  <Text style={styles.bankingValue}>{profile.bank_swift_code}</Text>
                </View>
              )}
            </View>
          )}

          {profile?.payment_terms && (
            <View style={styles.termsSection}>
              <Text style={styles.termsTitle}>Payment terms</Text>
              <Text style={styles.termsText}>{profile.payment_terms}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Generated by Qouta</Text>
            <Text style={styles.footerText}>{profile?.business_name || ''} · {profile?.phone || ''}</Text>
          </View>

        </Page>
      </Document>
    )

    const pdfBuffer = await renderToBuffer(doc)

    return new NextResponse(pdfBuffer, {
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