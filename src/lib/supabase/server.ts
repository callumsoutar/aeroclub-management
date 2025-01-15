import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Create a cached version of the server component client
export const createServerClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
})

// Create a service role client for admin operations
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper to get session on server side
export async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// Helper to get user on server side
export async function getUser() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error:', error)
    return null
  }
} 