import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || session.user.id

    const memberAccount = await db.memberAccount.findUnique({
      where: {
        userId: userId,
      },
      select: {
        balance: true,
      },
    })

    // If no member account exists, return 0 balance
    if (!memberAccount) {
      return NextResponse.json({ balance: 0 })
    }

    return NextResponse.json({ balance: memberAccount.balance })
  } catch (error) {
    console.error("[MEMBER_ACCOUNT_BALANCE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 