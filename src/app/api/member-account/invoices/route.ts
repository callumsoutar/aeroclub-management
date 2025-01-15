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

    // Get invoices for the user
    const invoices = await db.invoice.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        balanceRemaining: true,
        dueDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("[MEMBER_INVOICES]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 