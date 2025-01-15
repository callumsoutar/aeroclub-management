"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "lucide-react";

interface Booking {
  aircraft: string;
  member: string;
  instructor: string;
  description: string;
  times: string;
}

const bookings: Booking[] = [];

export function TodaysBookings() {
  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-2 p-4 border-b">
        <Calendar className="h-5 w-5" />
        <h2 className="font-semibold">Today&apos;s Bookings</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aircraft</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Times</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No bookings scheduled for today
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={`${booking.aircraft}-${booking.times}`}>
                <TableCell>{booking.aircraft}</TableCell>
                <TableCell>{booking.member}</TableCell>
                <TableCell>{booking.instructor}</TableCell>
                <TableCell>{booking.description}</TableCell>
                <TableCell>{booking.times}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 