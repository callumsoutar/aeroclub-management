"use client";

import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";
import { useAuthContext } from "@/providers/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b bg-background px-6">
          <UserNav user={user} />
        </header>
        <main className="flex-1 overflow-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
} 