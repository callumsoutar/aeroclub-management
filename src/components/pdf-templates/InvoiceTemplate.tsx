import React from 'react'
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { Invoice, InvoiceItem, Organization, User } from '@prisma/client'

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#666',
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  table: {
    flexDirection: 'column',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  description: { flex: 2 },
  quantity: { flex: 1, textAlign: 'right' },
  rate: { flex: 1, textAlign: 'right' },
  amount: { flex: 1, textAlign: 'right' },
  totals: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 8,
  },
  grandTotal: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 10,
  },
})

export interface ExtendedInvoice extends Invoice {
  items: (InvoiceItem & {
    chargeable: {
      name: string;
      description?: string | null;
    };
  })[];
  user: User;
  organization: Organization;
}

interface InvoiceTemplateProps {
  invoice: ExtendedInvoice;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyDetails}>{invoice.organization.name}</Text>
            <Text style={styles.companyDetails}>info@aeroclub.com</Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.dates}>
          <View>
            <Text>Issue Date: {format(new Date(invoice.issuedDate), 'dd MMM yyyy')}</Text>
            <Text>Due Date: {format(new Date(invoice.dueDate), 'dd MMM yyyy')}</Text>
          </View>
          <View>
            <Text>Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text>{invoice.user.name}</Text>
          <Text>{invoice.user.email}</Text>
        </View>

        {/* Charges Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>Description</Text>
            <Text style={styles.quantity}>Quantity</Text>
            <Text style={styles.rate}>Rate</Text>
            <Text style={styles.amount}>Amount</Text>
          </View>

          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.description}>{item.chargeable.name}</Text>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.rate}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.amount}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>${invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax:</Text>
            <Text>${invoice.tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total:</Text>
            <Text>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text style={{ marginTop: 4 }}>
            Please make payment by {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
          </Text>
          {invoice.notes && (
            <Text style={{ marginTop: 8 }}>{invoice.notes}</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}

export default InvoiceTemplate 