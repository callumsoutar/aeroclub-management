"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { PaymentModal } from "./payment-modal"
import { useRouter } from "next/navigation"

interface AddPaymentButtonProps {
  invoiceId: string
  invoiceNumber: string
  balanceDue: number
}

export function AddPaymentButton({
  invoiceId,
  invoiceNumber,
  balanceDue,
}: AddPaymentButtonProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const router = useRouter()

  const handlePaymentComplete = () => {
    router.refresh()
  }

  return (
    <>
      <Button
        onClick={() => setIsPaymentModalOpen(true)}
        className="flex items-center gap-3 h-12 px-6 text-lg"
        size="lg"
      >
        <CreditCard className="h-5 w-5" />
        Add Payment
      </Button>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        balanceDue={balanceDue}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  )
} 