"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  percentageChange: number;
}

function StatsCard({ title, value, percentageChange }: StatsCardProps) {
  const isPositive = percentageChange > 0;

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <div className={`flex items-center text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {isPositive ? (
              <ArrowUpIcon className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4" />
            )}
            {Math.abs(percentageChange)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Flights This Week"
        value="23"
        percentageChange={12}
      />
      <StatsCard
        title="Flying Hours This Week"
        value="50"
        percentageChange={8}
      />
      <StatsCard
        title="Active Members"
        value="270"
        percentageChange={-2}
      />
      <StatsCard
        title="Active Aircraft"
        value="8"
        percentageChange={1}
      />
    </div>
  );
} 