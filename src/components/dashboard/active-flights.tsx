"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

interface Flight {
  aircraft: string;
  member: string;
  instructor: string;
  checkedOut: string;
  eta: string;
}

const flights: Flight[] = [
  {
    aircraft: "ZK-KID",
    member: "Callum Soutar",
    instructor: "Sarah Brown",
    checkedOut: "05:32 PM",
    eta: "06:30 PM",
  },
];

export function ActiveFlights() {
  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-2 p-4 border-b">
        <Plane className="h-5 w-5" />
        <h2 className="font-semibold">Active Flights</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aircraft</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Checked Out</TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flights.map((flight) => (
            <TableRow key={`${flight.aircraft}-${flight.checkedOut}`}>
              <TableCell>{flight.aircraft}</TableCell>
              <TableCell>{flight.member}</TableCell>
              <TableCell>{flight.instructor}</TableCell>
              <TableCell>{flight.checkedOut}</TableCell>
              <TableCell>{flight.eta}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  Check In
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 