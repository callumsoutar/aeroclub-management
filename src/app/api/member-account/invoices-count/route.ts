import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get userId from query params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 })
    }

    // Get total count of invoices for the user
    const count = await db.invoice.count({
      where: {
        userId: userId,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("[MEMBER_INVOICES_COUNT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 