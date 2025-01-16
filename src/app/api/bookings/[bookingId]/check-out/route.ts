import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'

export async function POST(
  request: Request
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get bookingId from URL
    const url = new URL(request.url)
    const bookingId = url.pathname.split('/')[3]

    // Update booking status to flying
    await db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.flying }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error checking out booking:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    )
  }
} 