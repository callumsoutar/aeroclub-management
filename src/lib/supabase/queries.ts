import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const getInvoices = cache(async () => {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: invoices, error } = await supabase
    .from('Invoice')
    .select(`
      id,
      invoiceNumber,
      status,
      dueDate,
      issuedDate,
      total,
      user:userId (
        name
      )
    `)
    .order('issuedDate', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return invoices
}) 