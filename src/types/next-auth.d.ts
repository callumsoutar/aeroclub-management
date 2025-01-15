import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      organizationId: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    organizationId: string;
    role: UserRole;
  }
} 