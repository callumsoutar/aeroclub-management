import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "ACCOUNT_CREDIT"]),
  invoiceId: z.string(),
});

export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const body = paymentSchema.parse(json);

    // Get the invoice and user details
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("*, user:userId (*), organization:organizationId (*)")
      .eq("id", body.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Create payment record
    const paymentId = `pay-${crypto.randomUUID()}`;
    const { error: paymentError } = await supabase
      .from("Payment")
      .insert({
        id: paymentId,
        amount: body.amount,
        method: body.method,
        invoiceId: body.invoiceId,
        userId: invoice.userId,
        organizationId: invoice.organizationId,
        status: "COMPLETED",
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return new NextResponse("Failed to create payment", { status: 500 });
    }

    return new NextResponse(JSON.stringify({ success: true, paymentId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 