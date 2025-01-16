import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const bookings = await db.booking.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        startTime: 'desc'
      },
      include: {
        Aircraft: {
          select: {
            registration: true,
          },
        },
        User_Booking_instructor_idToUser: {
          select: {
            name: true,
          },
        },
        User_Booking_user_idToUser: {
          select: {
            name: true,
          },
        },
      },
    })

    const totalCount = await db.booking.count()

    return NextResponse.json({
      bookings,
      totalCount,
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
} 