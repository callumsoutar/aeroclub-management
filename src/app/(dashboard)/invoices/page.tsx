import type { Metadata } from "next"
import Link from "next/link"
import { InvoicesDataTable } from "@/components/invoices/invoices-data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Invoices",
  description: "Manage your invoices",
}

export default function InvoicesPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
        <div className="flex items-center space-x-2">
          <Link href="/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <InvoicesDataTable />
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <InvoicesDataTable status="PENDING" />
        </TabsContent>
        <TabsContent value="overdue" className="space-y-4">
          <InvoicesDataTable status="OVERDUE" />
        </TabsContent>
        <TabsContent value="paid" className="space-y-4">
          <InvoicesDataTable status="PAID" />
        </TabsContent>
      </Tabs>
    </div>
  )
} 