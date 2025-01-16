import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(
  request: Request
) {
  try {
    // Get the payment ID from the URL
    const url = new URL(request.url)
    const paymentId = url.pathname.split('/')[3]
    
    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies()
    });

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if user is authenticated
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the transaction associated with this payment
    const transaction = await db.transaction.findFirst({
      where: {
        payment: {
          id: paymentId,
        },
      },
      select: {
        id: true,
        receipt_number: true,
        createdAt: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TRANSACTION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 