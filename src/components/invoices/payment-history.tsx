import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Building2, Wallet, Clock } from "lucide-react";
import { PaymentMethod } from "@prisma/client";

interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  status: string;
  processedAt: Date | null;
  createdAt: Date;
}

interface Transaction {
  id: string;
  receipt_number: string;
  createdAt: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

const paymentMethodIcons: Record<PaymentMethod, React.ElementType> = {
  CASH: Banknote,
  CREDIT_CARD: CreditCard,
  BANK_TRANSFER: Building2,
  ACCOUNT_CREDIT: Wallet,
  VOUCHER: Banknote,
  OTHER: Banknote,
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  ACCOUNT_CREDIT: "Account Credit",
  VOUCHER: "Voucher",
  OTHER: "Other",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount);
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});

  useEffect(() => {
    async function fetchTransactions() {
      const transactionPromises = payments.map(payment =>
        fetch(`/api/payments/${payment.id}/transaction`)
          .then(res => res.ok ? res.json() : null)
      );

      const results = await Promise.all(transactionPromises);
      const transactionMap: Record<string, Transaction> = {};
      
      results.forEach((transaction, index) => {
        if (transaction) {
          transactionMap[payments[index].id] = transaction;
        }
      });

      setTransactions(transactionMap);
    }

    if (payments.length > 0) {
      fetchTransactions();
    }
  }, [payments]);

  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
        <div className="h-6 w-px bg-gray-200" />
        <span className="text-sm text-gray-500">{payments.length} payment{payments.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        {payments.map((payment) => {
          const Icon = paymentMethodIcons[payment.method];
          const transaction = transactions[payment.id];
          
          return (
            <div
              key={payment.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-50 p-2.5">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {paymentMethodLabels[payment.method]}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 mb-1">
                    {formatCurrency(payment.amount)}
                  </p>
                  <span
                    className={cn(
                      "inline-block rounded-full px-3 py-1 text-xs font-medium",
                      payment.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    )}
                  >
                    {payment.status === "PENDING" ? "Pending" : "Completed"}
                  </span>
                </div>
              </div>

              <div className="pl-[3.25rem] space-y-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(payment.createdAt), "MMMM do, yyyy")}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Time: {format(new Date(payment.createdAt), "h:mm a")}</span>
                  </div>
                </div>

                {transaction?.receipt_number && (
                  <p className="text-sm border-l-2 border-green-500 pl-2">
                    <span className="text-gray-500">Receipt Number: </span>
                    <span className="font-mono font-medium text-gray-900">{transaction.receipt_number}</span>
                  </p>
                )}

                <div className="text-sm text-gray-500 space-y-1 border-t border-gray-100 pt-2 mt-2">
                  {payment.reference && (
                    <p>
                      <span className="text-gray-500">Reference: </span>
                      <span className="text-gray-700">{payment.reference}</span>
                    </p>
                  )}
                  {payment.notes && (
                    <p>
                      <span className="text-gray-500">Notes: </span>
                      <span className="text-gray-700">{payment.notes}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 