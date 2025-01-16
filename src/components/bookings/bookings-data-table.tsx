"use client"

import { useState, useEffect } from "react"
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
  FilterFn,
} from "@tanstack/react-table"
import { rankItem } from "@tanstack/match-sorter-utils"
import { format } from "date-fns"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Badge } from "../ui/badge"

// Define the Booking type based on our schema
interface Booking {
  id: string
  type: string
  status: string
  description: string
  created_at: string
  startTime: string | null
  endTime: string | null
  Aircraft?: {
    registration: string
  } | null
  User_Booking_instructor_idToUser?: {
    name: string
  } | null
  User_Booking_user_idToUser?: {
    name: string
  } | null
}

// Define the columns
const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: "startTime",
    header: "Start Time",
    cell: ({ row }) => row.getValue("startTime") 
      ? format(new Date(row.getValue("startTime")), "PPp")
      : "N/A",
  },
  {
    accessorKey: "endTime",
    header: "End Time",
    cell: ({ row }) => row.getValue("endTime")
      ? format(new Date(row.getValue("endTime")), "PPp")
      : "N/A",
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP"),
  },
  {
    accessorKey: "Aircraft.registration",
    header: "Aircraft",
    cell: ({ row }) => row.original.Aircraft?.registration || "N/A",
  },
  {
    accessorKey: "User_Booking_instructor_idToUser.name",
    header: "Instructor",
    cell: ({ row }) => row.original.User_Booking_instructor_idToUser?.name || "N/A",
  },
  {
    accessorKey: "User_Booking_user_idToUser.name",
    header: "Student",
    cell: ({ row }) => row.original.User_Booking_user_idToUser?.name || "N/A",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "complete"
              ? "default"
              : status === "cancelled"
              ? "destructive"
              : "secondary"
          }
          className={
            status === "complete"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : status === "cancelled"
              ? "bg-red-100 text-red-800 hover:bg-red-100"
              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/bookings/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  },
]

const fuzzyFilter: FilterFn<Booking> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

export function BookingsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")

  // Replace the useState with useEffect for data fetching
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings')
        const data = await response.json()
        setData(data.bookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, []) // Empty dependency array means this runs once on mount

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
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