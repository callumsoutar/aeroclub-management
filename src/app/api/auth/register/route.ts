import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRole, MembershipStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("JSON parse error:", error);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { userId, email, name, organizationName } = body;

    if (!userId || !email || !name || !organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      // Test database connection
      await db.$connect();
    } catch (error) {
      console.error("Database connection error:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Create organization and user in a transaction
    try {
      const result = await db.$transaction(async (tx) => {
        // 1. Create the organization
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
          },
        });

        // 2. Create the user with the organization ID
        const user = await tx.user.create({
          data: {
            id: userId,
            email: email,
            name: name,
            organizationId: organization.id,
            role: UserRole.OWNER,
            memberStatus: MembershipStatus.ACTIVE,
            password: "", // This is just to satisfy Prisma schema, not used for auth
          },
        });

        return { organization, user };
      });

      // Update the user's metadata in Supabase with the organization ID using service role
      const supabase = createServiceRoleClient();
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            organizationId: result.organization.id,
            role: UserRole.OWNER,
            name: name
          }
        }
      );

      if (updateError) {
        console.error("Failed to update user metadata:", updateError);
        throw new Error("Failed to update user metadata");
      }

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 409 }
          );
        }
      }
      
      console.error("Transaction error:", error);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
} 