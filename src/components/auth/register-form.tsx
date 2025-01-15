"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/auth";
import { Eye, EyeOff, Building2, Mail, User, Lock } from "lucide-react";

const registerSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const supabase = createClient;

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true);

    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (authError) throw authError;

      // 2. Create organization and user records through server action
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authData.user?.id,
          email: data.email,
          name: data.name,
          organizationName: data.organizationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // If we get here, registration was successful
      toast.success("Registration successful! Please check your email to verify your account.");
      router.push("/auth/signin");
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle specific error messages
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to register. Please try again later.";
        
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Aero Club Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Canterbury Aero Club"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 pl-11"
                    autoComplete="off"
                    {...field}
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-gray-400 text-sm">
                This will be your organization&apos;s primary identifier
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="John Smith"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 pl-11"
                    autoComplete="off"
                    {...field}
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Email Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 pl-11"
                    autoComplete="off"
                    {...field}
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 pl-11 pr-10"
                    autoComplete="new-password"
                    {...field}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription className="text-gray-400 text-sm">
                Must be at least 8 characters long
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg mt-8"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
} 