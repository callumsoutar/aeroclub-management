import type { Metadata } from "next"
import { NewInvoiceForm } from "@/components/invoices/new-invoice-form"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "New Invoice",
  description: "Create a new invoice",
}

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
        <Badge variant="secondary" className="h-7 px-3 text-base">DRAFT</Badge>
      </div>
      <NewInvoiceForm />
    </div>
  )
} 