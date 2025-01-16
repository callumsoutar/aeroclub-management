import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { BookingService } from '@/services/bookings'

export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Await the entire params object first
    const { bookingId } = await context.params
    const userData = await BookingService.getUserOrganization(session.user.id)
    const booking = await BookingService.getBookingById(bookingId, userData.organizationId)

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error loading booking:', error)
    return new NextResponse(`Error loading booking: ${error}`, { status: 500 })
  }
} 