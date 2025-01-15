"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Plane,
  Calendar,
  Users,
  UserCog,
  FileText,
  CheckSquare,
  Settings,
} from "lucide-react";

const routes = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Aircraft",
    href: "/aircraft",
    icon: Plane,
  },
  {
    title: "Scheduler",
    href: "/scheduler",
    icon: Calendar,
  },
  {
    title: "Staff",
    href: "/staff",
    icon: UserCog,
  },
  {
    title: "Members",
    href: "/members",
    icon: Users,
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: Calendar,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      <div className="flex h-16 items-center px-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 font-semibold text-xl text-white">
          <Plane className="h-8 w-8" />
          <span>AeroManager</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pt-6">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium transition-all hover:text-white",
                pathname === route.href
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              <Icon className="h-6 w-6" />
              {route.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 