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
import Link from "next/link"

// Define the Member type based on our Prisma schema
interface Member {
  id: string
  name: string | null
  email: string
  memberStatus: "ACTIVE" | "SUSPENDED" | "EXPIRED"
  memberNumber: string | null
}

// Define table columns
const columns: ColumnDef<Member>[] = [
  {
    accessorKey: "memberNumber",
    header: "Member Number",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "memberStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("memberStatus") as string
      return (
        <Badge
          variant={
            status === "ACTIVE"
              ? "default"
              : status === "SUSPENDED"
              ? "destructive"
              : "secondary"
          }
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link href={`/members/view/${row.original.id}`}>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </Link>
    ),
  },
]

interface MembersDataTableProps {
  status?: "ACTIVE" | "SUSPENDED" | "EXPIRED"
}

export function MembersDataTable({ status }: MembersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [data, setData] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        setError(null)

        // First get the current user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw new Error('Failed to get session')
        }

        if (!session?.user) {
          console.error('No user in session:', session)
          throw new Error('No authenticated user')
        }

        const organizationId = session.user.user_metadata?.organizationId
        console.log('Current user organizationId:', organizationId)

        if (!organizationId) {
          console.error('No organizationId in metadata:', session.user.user_metadata)
          throw new Error('No organization found')
        }

        // Fetch members for the organization
        const { data: members, error: membersError } = await supabase
          .from('User')
          .select('id, name, email, memberStatus, memberNumber')
          .eq('organizationId', organizationId)
          .order('name')

        if (membersError) {
          console.error('Members fetch error:', membersError)
          throw membersError
        }

        setData(members || [])
      } catch (err) {
        console.error('Error fetching members:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchMembers()

    // Set up real-time subscription for the organization's members
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const organizationId = session?.user?.user_metadata?.organizationId

      if (organizationId) {
        const channel = supabase
          .channel('member-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'User',
              filter: `organizationId=eq.${organizationId}`
            },
            () => {
              fetchMembers()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }

    setupSubscription()
  }, [supabase])

  // Filter data based on status if provided
  const filteredData = status ? data.filter(member => member.memberStatus === status) : data

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
          placeholder="Search members..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("name")?.setFilterValue(event.target.value)
            table.getColumn("email")?.setFilterValue(event.target.value)
          }}
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
                  No members found. {status ? `No ${status.toLowerCase()} members available.` : 'Add your first member to get started.'}
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