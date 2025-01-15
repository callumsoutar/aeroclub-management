import { Button } from "@/components/ui/button";
import { AddPaymentButton } from "@/components/invoices/add-payment-button";
import { InvoiceDetails } from "@/components/invoices/invoice-details";
import { db } from "@/lib/db";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreVertical, Printer, Send, User } from "lucide-react";

interface InvoiceViewPageProps {
  params: {
    invoiceId: string;
  };
}

export default async function InvoiceViewPage({ params }: InvoiceViewPageProps) {
  const invoiceId = await params.invoiceId;

  const invoice = await db.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      organizationId: true,
      status: true,
      dueDate: true,
      invoiceNumber: true,
      issuedDate: true,
      notes: true,
      subtotal: true,
      tax: true,
      total: true,
      reference: true,
      balanceRemaining: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      organization: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          chargeable: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          reference: true,
          notes: true,
          status: true,
          processedAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!invoice) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Invoice Details</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" className="h-11 px-6 gap-2 text-base">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2 h-11">
                <Printer className="h-5 w-5" />
                Print PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-11">
                <Send className="h-5 w-5" />
                Send Invoice
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 h-11">
                <User className="h-5 w-5" />
                View Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {invoice.status !== "PAID" && (
            <AddPaymentButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber || ""}
              balanceDue={invoice.balanceRemaining ?? invoice.total}
            />
          )}
        </div>
      </div>

      <InvoiceDetails invoice={invoice} />
    </div>
  );
} 