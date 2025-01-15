import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getInvoiceDetails(invoiceId: string) {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch invoice with related user and organization data
  const { data: invoice, error } = await supabase
    .from("Invoice")
    .select(`
      *,
      user:userId (
        id,
        name,
        email
      ),
      organization:organizationId (
        id,
        name
      ),
      items:InvoiceItem (
        id,
        quantity,
        unitPrice,
        tax,
        total,
        description,
        chargeable:chargeableId (
          name,
          description
        )
      )
    `)
    .eq("id", invoiceId)
    .single()

  if (error || !invoice) {
    return null
  }

  return invoice
} 