"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount)
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  total: number
  balanceRemaining: number
  dueDate: string
  createdAt: string
}

interface MemberInvoicesTableProps {
  userId: string
}

export function MemberInvoicesTable({ userId }: MemberInvoicesTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/member-account/invoices?userId=${userId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch invoices")
        }
        const data = await response.json()
        setInvoices(data.invoices)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoices")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [userId])

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>
                  {format(new Date(invoice.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.total)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.balanceRemaining)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      invoice.status === "PAID"
                        ? "default"
                        : invoice.status === "OVERDUE"
                        ? "destructive"
                        : invoice.status === "PENDING"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      invoice.status === "PAID"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : invoice.status === "OVERDUE"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : invoice.status === "PENDING"
                        ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        : ""
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/invoices/view/${invoice.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 