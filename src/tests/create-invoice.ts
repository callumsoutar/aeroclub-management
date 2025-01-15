import { createClient } from '@supabase/supabase-js'

async function createTestInvoice() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get the first user from the database to use their ID
  const { data: users } = await supabase
    .from('User')
    .select('id, organizationId')
    .limit(1)

  if (!users || users.length === 0) {
    console.error('No users found in the database')
    return
  }

  const user = users[0]

  // Create the invoice with all required fields from the schema
  const { data, error } = await supabase
    .from('Invoice')
    .insert({
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      issuedDate: new Date().toISOString(),
      subtotal: 260.86, // Example: total before tax
      tax: 39.13, // Example: 15% GST
      total: 299.99,
      userId: user.id,
      organizationId: user.organizationId,
      notes: 'Test invoice created via script'
    })
    .select()

  if (error) {
    console.error('Error creating invoice:', error)
    return
  }

  console.log('Invoice created successfully:', data)
}

// Run the test
createTestInvoice() 