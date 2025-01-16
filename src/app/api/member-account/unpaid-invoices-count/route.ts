import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { InvoiceStatus } from "@prisma/client"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400 }
      )
    }

    // Get session to verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      )
    }

    // Count pending invoices for the user
    const unpaidCount = await db.invoice.count({
      where: {
        userId: userId,
        status: InvoiceStatus.PENDING,
      },
    })

    return new NextResponse(
      JSON.stringify({ count: unpaidCount }),
      { status: 200 }
    )

  } catch (error) {
    console.error("Error fetching unpaid invoices count:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    )
  }
} 