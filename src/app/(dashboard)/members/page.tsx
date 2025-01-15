import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersDataTable } from "@/components/members/members-data-table";

export const metadata: Metadata = {
  title: "Members | AeroManager",
  description: "Manage your aero club members",
};

export default async function MembersPage() {
  const supabase = createServerClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Members</h2>
        <div className="flex items-center space-x-2">
          <Link href="/members/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Member
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <MembersDataTable />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <MembersDataTable status="ACTIVE" />
        </TabsContent>
        <TabsContent value="suspended" className="space-y-4">
          <MembersDataTable status="SUSPENDED" />
        </TabsContent>
        <TabsContent value="expired" className="space-y-4">
          <MembersDataTable status="EXPIRED" />
        </TabsContent>
      </Tabs>
    </div>
  );
} 