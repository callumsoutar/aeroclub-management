import { db } from "@/lib/db"

export class BookingService {
  static async getAircraftTechLog(aircraftId: string) {
    return db.aircraftTechLog.findFirst({
      where: {
        aircraft_id: aircraftId,
      },
      orderBy: {
        created_at: 'desc'
      },
    })
  }

  static async getBookingById(id: string, organizationId: string) {
    const booking = await db.booking.findFirst({
      where: {
        AND: [
          { id },
          { organization_id: organizationId }
        ]
      },
      include: {
        Aircraft: {
          include: {
            AircraftTypes: true,
            AircraftRates: {
              where: {
                organization_id: organizationId,
              }
            }
          }
        },
        User_Booking_instructor_idToUser: {
          select: {
            name: true,
          }
        },
        User_Booking_user_idToUser: {
          select: {
            name: true,
          }
        },
        FlightTypes: true,
        BookingDetails: true,
        BookingFlightTimes: true,
        Lesson: true,
      }
    })

    if (!booking) {
      throw new Error("Booking not found")
    }

    // Fetch the latest tech log for the aircraft if it exists
    const techLog = booking.Aircraft ? 
      await BookingService.getAircraftTechLog(booking.Aircraft.id) : 
      null

    // Find the applicable rate for this booking's flight type
    const applicableRate = booking.Aircraft?.AircraftRates?.find(
      rate => rate.flight_type_id === booking.flight_type_id
    )

    return {
      ...booking,
      techLog,
      applicableRate
    }
  }

  static async getUserOrganization(userId: string) {
    const userData = await db.user.findUnique({
      where: { id: userId },
      select: {
        organizationId: true,
      },
    })

    if (!userData) {
      throw new Error("User data not found")
    }

    return userData
  }

  static async getAircraftRate(aircraftId: string, flightTypeId: string, organizationId: string) {
    return db.aircraftRates.findFirst({
      where: {
        aircraft_id: aircraftId,
        flight_type_id: flightTypeId,
        organization_id: organizationId,
      }
    })
  }
} 