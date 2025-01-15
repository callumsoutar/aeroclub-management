"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    organizationId?: string;
    imageUrl?: string | null;
    user_metadata?: {
      name?: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export function UserNav({ user }: UserNavProps) {
  const supabase = createClientComponentClient();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Get name from either user_metadata or direct name property
  const displayName = user.user_metadata?.display_name || user.user_metadata?.name || user.name || "";
  
  // Get avatar URL from metadata or direct imageUrl property
  const avatarUrl = user.user_metadata?.avatar_url || user.imageUrl;

  const handleSignOut = async (event: Event) => {
    event.preventDefault();
    
    try {
      await supabase.auth.signOut();
      // Force a hard refresh to clear all state
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || "User avatar"} />}
            <AvatarFallback>
              {displayName ? getInitials(displayName) : "?"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={handleSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 