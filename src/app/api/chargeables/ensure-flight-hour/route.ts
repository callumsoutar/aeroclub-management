import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { createFlightHourChargeable } from '@/scripts/create-flight-hour-chargeable'

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const organizationId = session.user.user_metadata?.organizationId
    if (!organizationId) {
      return new NextResponse('Organization ID not found', { status: 400 })
    }

    const chargeable = await createFlightHourChargeable(organizationId)
    return NextResponse.json(chargeable)
  } catch (error) {
    console.error('Error ensuring FLIGHT_HOUR chargeable:', error)
    return new NextResponse(`Error ensuring FLIGHT_HOUR chargeable: ${error}`, { status: 500 })
  }
} 