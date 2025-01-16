import { BookingsDataTable } from "@/components/bookings/bookings-data-table"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"

export default function BookingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="Bookings"
          description="Manage bookings for your aeroclub"
        />
      </div>
      <Separator />
      <BookingsDataTable />
    </div>
  )
} 