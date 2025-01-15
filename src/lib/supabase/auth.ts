'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

// Export the client creation function
export const createClient = createClientComponentClient()

export function useAuth() {
  const supabase = createClient
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get session on mount
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      if (error) {
        console.error('Error getting session:', error)
      }
    }

    getSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return {
    user,
    loading,
  }
}

export type { User, Session } from '@supabase/auth-helpers-nextjs' 