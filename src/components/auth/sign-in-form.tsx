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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/auth";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient;

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInValues) {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in successfully");
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  {...field}
                  disabled={isLoading}
                />
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
              <div className="flex justify-between items-center">
                <FormLabel className="text-gray-300">Password</FormLabel>
                <Link href="/auth/forgot-password" className="text-sm text-emerald-500 hover:text-emerald-400">
                  Don&apos;t remember your password?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
} 