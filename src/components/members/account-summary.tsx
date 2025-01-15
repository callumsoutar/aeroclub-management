"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, Receipt, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountSummaryProps {
  userId: string
}

interface AccountData {
  balance: number
  totalInvoices: number
  unpaidInvoices: number
}

export function AccountSummary({ userId }: AccountSummaryProps) {
  const [data, setData] = useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAccountData() {
      try {
        setIsLoading(true)
        const [balanceRes, invoicesRes, unpaidRes] = await Promise.all([
          fetch(`/api/member-account/balance?userId=${userId}`),
          fetch(`/api/member-account/invoices-count?userId=${userId}`),
          fetch(`/api/member-account/unpaid-invoices-count?userId=${userId}`)
        ])

        if (!balanceRes.ok || !invoicesRes.ok || !unpaidRes.ok) {
          throw new Error("Failed to fetch account data")
        }

        const balanceData = await balanceRes.json()
        const invoicesData = await invoicesRes.json()
        const unpaidData = await unpaidRes.json()

        setData({
          balance: balanceData.balance,
          totalInvoices: invoicesData.count,
          unpaidInvoices: unpaidData.count
        })
      } catch (error) {
        console.error("Error fetching account data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccountData()
  }, [userId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Current Balance
              </p>
              <p className={cn(
                "text-2xl font-bold",
                (data?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(data?.balance ?? 0)}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Invoices
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.totalInvoices ?? 0} invoices
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Unpaid Invoices
              </p>
              <p className="text-2xl font-bold text-red-600">
                {data?.unpaidInvoices ?? 0} unpaid
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-100 via-red-200 to-red-100" />
        </CardContent>
      </Card>
    </div>
  )
} 