"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Link from "next/link"

// Define the Invoice type based on our Prisma schema
interface DatabaseUser {
  name: string | null
}

interface DatabaseInvoice {
  id: string
  invoiceNumber: string
  status: "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  dueDate: string
  issuedDate: string
  total: number
  userId: string
  organizationId: string
  User: DatabaseUser | null
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
  dueDate: Date
  issuedDate: Date
  total: number
  userId: string
  organizationId: string
  user: {
    name: string | null
  }
}

// Define table columns
const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
  },
  {
    accessorKey: "issuedDate",
    header: "Date",
    cell: ({ row }) => {
      return format(new Date(row.getValue("issuedDate")), "MMM dd, yyyy")
    },
  },
  {
    accessorKey: "user.name",
    header: "Member",
  },
  {
    accessorKey: "total",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total"))
      const formatted = new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency: "NZD",
      }).format(amount)
      return formatted
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "PAID"
              ? "default"
              : status === "OVERDUE"
              ? "destructive"
              : status === "PENDING"
              ? "default"
              : "secondary"
          }
          className={
            status === "PAID"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : status === "OVERDUE"
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : status === "PENDING"
              ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
              : ""
          }
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      return format(new Date(row.getValue("dueDate")), "MMM dd, yyyy")
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/invoices/view/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
    ),
  },
]

interface InvoicesDataTableProps {
  status?: "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED"
}

export function InvoicesDataTable({ status }: InvoicesDataTableProps) {
  const [role, setRole] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [data, setData] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Separate useEffect for role fetching
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        console.log('Fetching user role...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session?.user) {
          console.error('No user in session')
          throw new Error('No authenticated user')
        }

        console.log('User ID:', session.user.id)
        
        const { data: user, error: userError } = await supabase
          .from('User')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user role:', userError)
          throw userError
        }

        console.log('Fetched user role:', user?.role)
        setRole(user?.role || null)
      } catch (err) {
        console.error('Error in fetchUserRole:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user role')
      }
    }

    fetchUserRole()
  }, [supabase])

  // Separate useEffect for invoice fetching
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        console.log('Current role:', role)
        
        if (!role) {
          console.log('Role not yet set, waiting...')
          return
        }

        setLoading(true)
        setError(null)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw new Error('Failed to get session')
        }

        if (!session?.user) {
          console.error('No user in session')
          throw new Error('No authenticated user')
        }

        const organizationId = session.user.user_metadata?.organizationId
        console.log('Organization ID:', organizationId)

        if (!organizationId) {
          console.error('No organizationId in metadata')
          throw new Error('No organization found')
        }

        console.log('Fetching invoices for organization:', organizationId)
        
        // Debug query parameters
        console.log('Query parameters:', {
          organizationId,
          userId: session.user.id,
          role
        })
        
        let query = supabase
          .from('Invoice')
          .select(`
            id,
            invoiceNumber,
            status,
            dueDate,
            issuedDate,
            total,
            userId,
            organizationId,
            User (
              name
            )
          `)
          .eq('organizationId', organizationId)

        // If user is a MEMBER, only show their invoices
        if (role === 'MEMBER') {
          query = query.eq('userId', session.user.id)
        }

        // Add ordering
        const { data, error: invoicesError } = await query.order('issuedDate', { ascending: false })

        if (invoicesError) {
          console.error('Invoice fetch error:', invoicesError)
          console.error('Error details:', {
            message: invoicesError.message,
            details: invoicesError.details,
            hint: invoicesError.hint
          })
          throw invoicesError
        }

        const invoices = data as unknown as DatabaseInvoice[]
        console.log('Raw invoice data:', invoices)
        console.log('Fetched invoices:', invoices?.length || 0)

        if (!invoices) {
          setData([])
          return
        }

        const transformedData: Invoice[] = invoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          dueDate: new Date(invoice.dueDate),
          issuedDate: new Date(invoice.issuedDate),
          total: invoice.total,
          userId: invoice.userId,
          organizationId: invoice.organizationId,
          user: {
            name: invoice.User?.name ?? 'Unknown'
          }
        }))

        console.log('Setting transformed data:', transformedData.length)
        setData(transformedData)
      } catch (err) {
        console.error('Error in fetchInvoices:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()

    // Set up real-time subscription for the organization's invoices
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const organizationId = session?.user?.user_metadata?.organizationId

      if (organizationId) {
        console.log('Setting up real-time subscription for organization:', organizationId)
        const channel = supabase
          .channel('invoice-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Invoice',
              filter: `organizationId=eq.${organizationId}`
            },
            () => {
              console.log('Received real-time update, fetching invoices...')
              fetchInvoices()
            }
          )
          .subscribe()

        return () => {
          console.log('Cleaning up subscription')
          supabase.removeChannel(channel)
        }
      }
    }

    if (role === 'ADMIN' || role === 'OWNER') {
      setupSubscription()
    }
  }, [supabase, role])

  // Filter data based on status if provided
  const filteredData = status ? data.filter(invoice => invoice.status === status) : data

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-24 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search invoices..."
          value={(table.getColumn("invoiceNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("invoiceNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No invoices found. {status ? `No ${status.toLowerCase()} invoices available.` : 'Create your first invoice to get started.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
} 