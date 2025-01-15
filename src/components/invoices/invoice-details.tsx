"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";
import { PaymentHistory } from "./payment-history";

interface InvoiceDetailsProps {
  invoice: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    organizationId: string;
    status: string;
    dueDate: Date;
    invoiceNumber: string | null;
    issuedDate: Date;
    notes: string | null;
    subtotal: number;
    tax: number;
    total: number;
    reference: string | null;
    balanceRemaining: number | null;
    user: {
      name: string | null;
      email: string;
    };
    organization: {
      name: string;
    };
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      chargeable: {
        name: string;
        description: string | null;
      };
    }[];
    payments: {
      id: string;
      amount: number;
      method: PaymentMethod;
      reference: string | null;
      notes: string | null;
      status: string;
      processedAt: Date | null;
      createdAt: Date;
    }[];
  };
}

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/10 text-green-700";
      case "OVERDUE":
        return "bg-red-500/10 text-red-700";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount);
  };

  return (
    <Card className="p-8 max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
          <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
        </div>
        <Badge 
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full",
            getStatusColor(invoice.status)
          )}
        >
          {invoice.status}
        </Badge>
      </div>

      {/* Organization and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">FROM</h2>
          <p className="font-medium text-gray-900">{invoice.organization.name}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">BILL TO</h2>
          <p className="font-medium text-gray-900">{invoice.user.name || invoice.user.email}</p>
          <p className="text-gray-500">{invoice.user.email}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">ISSUE DATE</h2>
          <p className="text-gray-900">{format(new Date(invoice.createdAt), "PPP")}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">DUE DATE</h2>
          <p className="text-gray-900">{format(new Date(invoice.dueDate), "PPP")}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-semibold text-gray-500">
          <div className="col-span-6">ITEM</div>
          <div className="col-span-2 text-right">QTY</div>
          <div className="col-span-2 text-right">PRICE</div>
          <div className="col-span-2 text-right">AMOUNT</div>
        </div>
        <Separator className="mb-4" />
        {invoice.items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 mb-4 text-gray-900">
            <div className="col-span-6">
              <p className="font-medium">{item.chargeable.name}</p>
              {item.chargeable.description && (
                <p className="text-sm text-gray-500 mt-1">{item.chargeable.description}</p>
              )}
            </div>
            <div className="col-span-2 text-right">{item.quantity}</div>
            <div className="col-span-2 text-right">{formatCurrency(item.unitPrice)}</div>
            <div className="col-span-2 text-right">{formatCurrency(item.quantity * item.unitPrice)}</div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="mt-8 rounded-lg bg-gray-50 p-6">
        {/* Totals */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="text-gray-700">{formatCurrency(invoice.tax)}</span>
          </div>
          <Separator className="my-3" />
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-lg font-medium text-gray-700">Balance Due</span>
            <span 
              className={cn(
                "text-xl font-bold",
                (invoice.balanceRemaining === 0 || invoice.balanceRemaining === null && invoice.total === 0) 
                  ? "text-green-600" 
                  : "text-red-600"
              )}
            >
              {formatCurrency(invoice.balanceRemaining ?? invoice.total)}
            </span>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && <PaymentHistory payments={invoice.payments} />}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">NOTES</h2>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}
    </Card>
  );
} 