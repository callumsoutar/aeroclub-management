import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("Session error:", sessionError)
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "5")
    const offset = (page - 1) * limit

    // Get the organization ID from the user's metadata
    const organizationId = session.user.user_metadata?.organizationId

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      )
    }

    // Get total count for the organization
    const totalCount = await db.invoice.count({
      where: {
        organizationId: organizationId,
      },
    })

    // Get paginated invoices for the organization
    const invoices = await db.invoice.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      invoices,
      totalCount,
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
} 