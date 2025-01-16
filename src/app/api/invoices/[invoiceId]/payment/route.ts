import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request
) {
  try {
    // Get invoiceId from URL
    const url = new URL(request.url)
    const invoiceId = url.pathname.split('/')[3]

    const paymentData = await db.payment.findFirst({
      where: {
        invoiceId: invoiceId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!paymentData) {
      return new NextResponse(null, { status: 404 });
    }

    // Transform payment data to match component props
    const payment = {
      id: paymentData.id,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      notes: paymentData.notes,
      status: paymentData.status,
      processedAt: paymentData.processedAt?.toISOString(),
      createdAt: paymentData.createdAt.toISOString(),
      user: {
        name: paymentData.user.name || "Unknown",
        email: paymentData.user.email,
      },
    };

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[PAYMENT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 