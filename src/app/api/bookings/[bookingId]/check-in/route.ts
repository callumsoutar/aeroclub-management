import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { BookingService } from '@/services/bookings'
import { DEFAULT_TAX_RATE, INVOICE_DUE_DAYS } from '@/constants/chargeable'
import { z } from 'zod'

type Context = {
  params: { bookingId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Validation schema for request body
const checkInSchema = z.object({
  startTacho: z.number().nonnegative(),
  endTacho: z.number().nonnegative(),
  startHobbs: z.number().nonnegative(),
  endHobbs: z.number().nonnegative(),
  flightTime: z.number().positive(),
  comments: z.string().optional().nullable(),
  calculatedCharge: z.number().nonnegative(),
  chargeableId: z.string().min(1),
  organizationId: z.string().min(1),
  additionalInvoiceItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    total: z.number().nonnegative(),
    chargeableId: z.string().min(1)
  })).default([])
})

export async function POST(
  request: Request,
  context: Context
): Promise<Response> {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    
    // Log the received body for debugging
    console.log('Received request body:', body)
    
    // Validate request body
    const validationResult = checkInSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.flatten())
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

    const validatedData = validationResult.data
    const { 
      startTacho, 
      endTacho, 
      startHobbs, 
      endHobbs,
      flightTime,
      comments,
      calculatedCharge,
      chargeableId,
      organizationId,
      additionalInvoiceItems 
    } = validatedData

    const { bookingId } = context.params

    // Verify user has access to this organization's booking
    try {
      await BookingService.getUserOrganization(session.user.id)
    } catch {
      return new NextResponse(
        'User does not have access to this organization', 
        { status: 403 }
      )
    }

    // Get the booking to access user_id
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        user_id: true,
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

    if (!booking?.user_id) {
      return new NextResponse('Booking not found or has no associated user', { status: 404 })
    }

    // Ensure user_id is a string and not null
    const userId = booking.user_id as string

    // Use a transaction to ensure all database operations succeed or fail together
    const result = await db.$transaction(async (tx) => {
      // Create or update BookingFlightTimes
      const flightTimes = await tx.bookingFlightTimes.create({
        data: {
          start_tacho: startTacho,
          end_tacho: endTacho,
          start_hobbs: startHobbs,
          end_hobbs: endHobbs,
          flight_time: flightTime,
        },
      })

      // Update Booking with flight times and status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          booking_flight_times_id: flightTimes.id,
          status: "complete",
          description: comments,
        },
      })

      // Calculate total invoice amount including additional items
      const totalAdditionalCharges = additionalInvoiceItems.reduce(
        (sum, item) => sum + item.total,
        0
      )
      const subtotal = calculatedCharge + totalAdditionalCharges
      const tax = subtotal * DEFAULT_TAX_RATE
      const total = subtotal + tax

      // Set due date
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + INVOICE_DUE_DAYS)

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          userId,
          organizationId,
          dueDate,
          subtotal,
          tax,
          total,
          status: "PENDING",
          reference: `Flight: ${
            booking.Aircraft?.registration === null ? '' : booking.Aircraft?.registration
          } - ${
            booking.FlightTypes?.name === null ? 'Flight' : booking.FlightTypes?.name
          }`
        }
      })

      // Create flight time invoice item
      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          chargeableId,
          quantity: 1,
          unitPrice: calculatedCharge,
          tax: DEFAULT_TAX_RATE,
          total: calculatedCharge * (1 + DEFAULT_TAX_RATE),
          subTotal: calculatedCharge,
          organizationId,
          description: `Flight Time: ${flightTime} hrs - ${
            booking.Aircraft?.registration === null ? '' : booking.Aircraft?.registration
          } ${
            booking.Aircraft?.AircraftTypes?.model === null ? '' : booking.Aircraft?.AircraftTypes?.model
          }`
        }
      })

      // Create additional invoice items
      if (additionalInvoiceItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: additionalInvoiceItems.map((item) => ({
            invoiceId: invoice.id,
            chargeableId: item.chargeableId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: DEFAULT_TAX_RATE,
            total: item.total * (1 + DEFAULT_TAX_RATE),
            subTotal: item.total,
            organizationId,
            description: item.description
          }))
        })
      }

      return { invoiceId: invoice.id }
    })

    return NextResponse.json({ 
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error completing check-in:', error)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    )
  }
} 