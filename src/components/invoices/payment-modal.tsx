"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Banknote, CreditCard, Building2, Wallet, Receipt, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface AccountBalance {
  balance: number;
}

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "ACCOUNT_CREDIT"], {
    required_error: "Please select a payment method",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
  useAccountCredit: z.boolean().optional(),
  accountCreditAmount: z.coerce.number().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentMethodOption {
  value: PaymentFormValues["method"];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    value: "CASH",
    label: "Cash",
    icon: Banknote,
    description: "Pay with cash in person",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building2,
    description: "Direct bank transfer",
  },
  {
    value: "CREDIT_CARD",
    label: "Credit Card",
    icon: CreditCard,
    description: "Pay by credit or debit card",
  },
  {
    value: "ACCOUNT_CREDIT",
    label: "Account Credit",
    icon: Wallet,
    description: "Use available account credit",
  },
];

const getMethodStyles = (value: string) => {
  switch (value) {
    case "CASH":
      return {
        base: "border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50",
        selected: "border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100",
        icon: "text-emerald-600",
      };
    case "BANK_TRANSFER":
      return {
        base: "border-blue-200 hover:border-blue-300 hover:bg-blue-50",
        selected: "border-blue-500/50 bg-blue-50 hover:bg-blue-100",
        icon: "text-blue-600",
      };
    case "CREDIT_CARD":
      return {
        base: "border-purple-200 hover:border-purple-300 hover:bg-purple-50",
        selected: "border-purple-500/50 bg-purple-50 hover:bg-purple-100",
        icon: "text-purple-600",
      };
    case "ACCOUNT_CREDIT":
      return {
        base: "border-amber-200 hover:border-amber-300 hover:bg-amber-50",
        selected: "border-amber-500/50 bg-amber-50 hover:bg-amber-100",
        icon: "text-amber-600",
      };
    default:
      return {
        base: "",
        selected: "",
        icon: "text-primary",
      };
  }
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  balanceDue: number;
  onPaymentComplete: () => void;
}

interface PaymentResponse {
  success: boolean;
  paymentId: string;
}

interface TransactionResponse {
  id: string;
  receipt_number: string;
  createdAt: string;
}

interface PaymentStatus {
  success?: boolean;
  receiptNumbers: string[];
  error?: string;
  processingStep?: 'creating-payment' | 'waiting-for-receipt' | 'complete';
}

export function PaymentModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  balanceDue,
  onPaymentComplete,
}: PaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [useAccountCredit, setUseAccountCredit] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ 
    receiptNumbers: [] 
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balanceDue,
      method: "CASH",
      reference: "",
      notes: "",
      useAccountCredit: false,
      accountCreditAmount: 0,
    },
  });

  // Fetch account balance when modal opens
  useEffect(() => {
    async function fetchAccountBalance() {
      try {
        setIsLoadingBalance(true);
        const response = await fetch("/api/member-account/balance");
        if (response.ok) {
          const data: AccountBalance = await response.json();
          setAccountBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch account balance:", error);
        toast.error("Failed to fetch account balance");
      } finally {
        setIsLoadingBalance(false);
      }
    }

    if (isOpen) {
      fetchAccountBalance();
    }
  }, [isOpen]);

  // Watch for relevant form fields
  const selectedAmount = form.watch("amount");
  const accountCreditAmount = form.watch("accountCreditAmount");

  // Calculate remaining amount after account credit
  const remainingAmount = Math.max(0, selectedAmount - (accountCreditAmount || 0));

  useEffect(() => {
    if (useAccountCredit && accountBalance !== null) {
      // Set account credit amount to either the full balance or the invoice amount, whichever is smaller
      const maxCreditAmount = Math.min(accountBalance, selectedAmount);
      form.setValue("accountCreditAmount", maxCreditAmount);
      
      // If there's remaining amount, ensure a payment method is selected
      if (remainingAmount > 0) {
        form.setValue("method", form.getValues("method") || "CASH");
      }
    } else {
      form.setValue("accountCreditAmount", 0);
    }
  }, [useAccountCredit, accountBalance, selectedAmount, form, remainingAmount]);

  async function onSubmit(data: PaymentFormValues) {
    try {
      setIsSubmitting(true);
      setPaymentStatus({ 
        receiptNumbers: [],
        processingStep: 'creating-payment'
      });

      // Create array to hold payment promises
      const payments = [];

      // If using account credit and there's a valid amount
      if (useAccountCredit && data.accountCreditAmount && data.accountCreditAmount > 0) {
        payments.push(
          fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: data.accountCreditAmount,
              method: "ACCOUNT_CREDIT",
              invoiceId,
              reference: "Account Credit",
              notes: "Partial payment using account credit",
            }),
          }).then(res => res.json())
        );
      }

      // If there's a remaining amount, create second payment
      if (remainingAmount > 0) {
        payments.push(
          fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: remainingAmount,
              method: data.method,
              invoiceId,
              reference: data.reference,
              notes: data.notes,
            }),
          }).then(res => res.json())
        );
      }

      // Process all payments and wait for responses
      const responses: PaymentResponse[] = await Promise.all(payments);
      
      setPaymentStatus(prev => ({
        ...prev,
        processingStep: 'waiting-for-receipt'
      }));

      // Check if all payments were successful and collect receipt numbers
      for (const response of responses) {
        if (!response.success) {
          throw new Error("Payment failed: The payment could not be processed");
        }
        if (!response.paymentId) {
          throw new Error("Payment ID missing: The payment was created but no ID was returned");
        }

        // Poll for transaction details
        let transactionResponse: TransactionResponse | null = null;
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 100; // 100ms between attempts

        while (!transactionResponse && attempts < maxAttempts) {
          try {
            const res = await fetch(`/api/payments/${response.paymentId}/transaction`);
            if (!res.ok) {
              throw new Error(`Transaction fetch failed: ${res.statusText}`);
            }
            const data = await res.json();
            // Type guard to ensure data matches our TransactionResponse interface
            if ('receipt_number' in data && typeof data.receipt_number === 'string') {
              transactionResponse = data as TransactionResponse;
              setPaymentStatus(prev => ({
                receiptNumbers: [...prev.receiptNumbers, data.receipt_number]
              }));
              break;
            }
          } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
        }

        if (!transactionResponse?.receipt_number) {
          throw new Error("Transaction timeout: Receipt number could not be generated after multiple attempts");
        }
      }

      toast.success("Payment processed successfully");
      setPaymentStatus(prev => ({
        ...prev,
        success: true,
        processingStep: 'complete'
      }));
      // Only call onPaymentComplete when the user clicks "Close"
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus({
        success: false,
        receiptNumbers: [],
        error: "Failed to process payment. Please try again.",
      });
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {paymentStatus.success ? "Payment Complete" : "Add Payment"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {paymentStatus.success 
              ? "Payment has been processed successfully"
              : `Add a payment for Invoice #${invoiceNumber}`}
          </DialogDescription>
        </DialogHeader>

        {/* Show success or error state if payment was processed */}
        {paymentStatus.success !== undefined ? (
          <div className="py-6 text-center">
            {paymentStatus.success ? (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Payment Successful
                  </h3>
                  {paymentStatus.receiptNumbers.map((receiptNumber, index) => (
                    <p key={receiptNumber} className="text-gray-600">
                      Receipt Number: <span className="font-mono font-medium">{receiptNumber}</span>
                      {index < paymentStatus.receiptNumbers.length - 1 && <br />}
                    </p>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    onPaymentComplete();
                    onClose();
                  }}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Payment Failed
                  </h3>
                  <p className="text-gray-600">{paymentStatus.error}</p>
                </div>
                <Button
                  onClick={() => setPaymentStatus({ receiptNumbers: [] })}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Account Balance Display with Checkbox */}
              {!isLoadingBalance && accountBalance !== null && accountBalance > 0 && (
                <div className="space-y-4">
                  <Alert className="bg-gray-50 border-gray-200 border-l-4 border-l-blue-500">
                    <AlertDescription className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={useAccountCredit}
                          onCheckedChange={(checked: boolean) => {
                            setUseAccountCredit(checked);
                            form.setValue("useAccountCredit", checked);
                          }}
                          className="h-4 w-4"
                        />
                        <span className="font-medium">Use Account Credit</span>
                      </div>
                      <span className="font-semibold text-blue-600">
                        ${accountBalance.toFixed(2)} available
                      </span>
                    </AlertDescription>
                  </Alert>

                  {useAccountCredit && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="accountCreditAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Account Credit Amount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  max={Math.min(accountBalance, selectedAmount)}
                                  className="pl-7 text-lg"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (value > accountBalance) {
                                      field.onChange(accountBalance);
                                    } else if (value > selectedAmount) {
                                      field.onChange(selectedAmount);
                                    } else {
                                      field.onChange(value);
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {remainingAmount > 0 && (
                        <Alert>
                          <AlertDescription>
                            Remaining amount to be paid: ${remainingAmount.toFixed(2)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Only show amount field if not using account credit or if there's remaining amount */}
              {(!useAccountCredit || remainingAmount > 0) && (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        {useAccountCredit ? "Remaining Amount" : "Amount"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-7 text-lg"
                            value={useAccountCredit ? remainingAmount : field.value}
                            disabled={useAccountCredit}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {!isLoadingBalance && accountBalance !== null && (
                        <p className={cn(
                          "text-sm mt-2",
                          accountBalance > 0 ? "text-green-600" : "text-gray-500"
                        )}>
                          Account Balance: ${accountBalance.toFixed(2)}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              )}

              {/* Only show payment method selection if not using account credit or if there's remaining amount */}
              {(!useAccountCredit || remainingAmount > 0) && (
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">Payment Method</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        {paymentMethods
                          .filter(method => method.value !== "ACCOUNT_CREDIT")
                          .map((method) => {
                            const Icon = method.icon;
                            const styles = getMethodStyles(method.value);

                            return (
                              <Button
                                key={method.value}
                                type="button"
                                variant="outline"
                                className={cn(
                                  "h-auto flex-col items-start gap-2 p-4 transition-all duration-200",
                                  styles.base,
                                  field.value === method.value && styles.selected
                                )}
                                onClick={() => field.onChange(method.value)}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon className={cn("h-5 w-5", styles.icon)} />
                                  <span className="font-medium">{method.label}</span>
                                </div>
                                <p className="text-xs text-gray-500 text-left">
                                  {method.description}
                                </p>
                              </Button>
                            );
                          })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Reference and Notes fields */}
              {(!useAccountCredit || remainingAmount > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Payment reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="min-w-[120px] bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 animate-spin" />
                      {paymentStatus.processingStep === 'creating-payment' && "Creating Payment..."}
                      {paymentStatus.processingStep === 'waiting-for-receipt' && "Generating Receipt..."}
                      {!paymentStatus.processingStep && "Processing..."}
                    </div>
                  ) : (
                    "Add Payment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 