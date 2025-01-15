import { Metadata } from "next";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ActiveFlights } from "@/components/dashboard/active-flights";
import { TodaysBookings } from "@/components/dashboard/todays-bookings";
import { AircraftDefects } from "@/components/dashboard/aircraft-defects";

export const metadata: Metadata = {
  title: "Dashboard | AeroClub Manager",
  description: "Overview of your aeroclub's operations",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <StatsCards />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ActiveFlights />
        <TodaysBookings />
      </div>
      <AircraftDefects />
    </div>
  );
} 