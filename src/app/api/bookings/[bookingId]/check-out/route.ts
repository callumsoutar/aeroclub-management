import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { z } from 'zod'

// Validation schema for request body
const checkOutSchema = z.object({
  route: z.string().optional().nullable(),
  eta: z.string().optional().nullable(),
  passengers: z.string().optional().nullable(),
  equipment: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    selected: z.boolean()
  }))
})

export async function POST(
  request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = checkOutSchema.safeParse(body)
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid request data', 
          details: validationResult.error.flatten() 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { route, eta, passengers } = validationResult.data
    const { bookingId } = params

    // Use a transaction to ensure all database operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // First check if the booking exists and can be checked out
      const existingBooking = await tx.booking.findUnique({
        where: { id: bookingId }
      })

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      if (existingBooking.status !== 'confirmed') {
        throw new Error('Booking must be confirmed before check-out')
      }

      // Create BookingDetails record
      const bookingDetails = await tx.bookingDetails.create({
        data: {
          route: route || null,
          eta: eta ? new Date(`1970-01-01T${eta}:00`) : null,
          passengers: passengers || null,
        },
      })

      // Update Booking with flight details and status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.flying,
          booking_details_id: bookingDetails.id,
        },
        include: {
          BookingDetails: true,
          Aircraft: {
            select: {
              registration: true,
              AircraftTypes: {
                select: {
                  model: true
                }
              }
            }
          },
          FlightTypes: {
            select: {
              name: true
            }
          }
        }
      })

      return updatedBooking
    })

    return NextResponse.json({ 
      success: true,
      booking: result
    })
  } catch (error) {
    console.error('Error completing check-out:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    )
  }
} 