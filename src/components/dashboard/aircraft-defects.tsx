"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Defect {
  aircraft: string;
  issue: string;
  status: "Open" | "In Progress" | "Resolved";
  reported: string;
}

const defects: Defect[] = [
  {
    aircraft: "ZK-KID",
    issue: "Doesn't transmit mode A or C",
    status: "Open",
    reported: "1/4/2025",
  },
  {
    aircraft: "ZK-KAL",
    issue: "Oil pressure gauge fluctuating during flight",
    status: "Open",
    reported: "3/20/2024",
  },
  {
    aircraft: "ZK-KID",
    issue: "Directional gyro showing excessive drift",
    status: "In Progress",
    reported: "3/19/2024",
  },
  {
    aircraft: "ZK-KID",
    issue: "Right seat belt showing signs of wear",
    status: "In Progress",
    reported: "3/18/2024",
  },
  {
    aircraft: "ZK-KAL",
    issue: "Right brake squeaking during application",
    status: "In Progress",
    reported: "3/15/2024",
  },
  {
    aircraft: "ZK-KID",
    issue: "Intermittent static in COM1",
    status: "Resolved",
    reported: "3/10/2024",
  },
];

export function AircraftDefects() {
  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-2 p-4 border-b">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="font-semibold">Aircraft Defects</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aircraft</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reported</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {defects.map((defect, index) => (
            <TableRow key={index}>
              <TableCell>{defect.aircraft}</TableCell>
              <TableCell>{defect.issue}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    defect.status === "Open"
                      ? "destructive"
                      : defect.status === "In Progress"
                      ? "default"
                      : "secondary"
                  }
                >
                  {defect.status}
                </Badge>
              </TableCell>
              <TableCell>{defect.reported}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 