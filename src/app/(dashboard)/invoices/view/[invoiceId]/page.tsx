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
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function InvoiceViewPage({ 
  params: { invoiceId }
}: InvoiceViewPageProps) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      organization: true,
      user: true,
      items: {
        include: {
          chargeable: {
            select: {
              name: true,
              description: true
            }
          }
        }
      },
      payments: true
    }
  });

  const formattedInvoice = invoice ? {
    ...invoice,
    subtotal: Number(invoice.subtotal),
    tax: Number(invoice.tax),
    total: Number(invoice.total),
    balanceRemaining: invoice.balanceRemaining ? Number(invoice.balanceRemaining) : null,
    items: invoice.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      chargeable: item.chargeable
    })),
    payments: invoice.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  } : null;

  if (!formattedInvoice) {
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

          {formattedInvoice.status !== "PAID" && (
            <AddPaymentButton
              invoiceId={formattedInvoice.id}
              invoiceNumber={formattedInvoice.invoiceNumber || ""}
              balanceDue={formattedInvoice.balanceRemaining ?? formattedInvoice.total}
            />
          )}
        </div>
      </div>

      <InvoiceDetails invoice={formattedInvoice} />
    </div>
  );
} 