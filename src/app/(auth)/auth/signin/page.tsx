import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Plane } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/10">
          <div className="flex flex-col items-center space-y-2 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-2">
              <Plane className="h-6 w-6 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AeroManager</h1>
            <div className="flex gap-8 text-sm">
              <Link href="/auth/signin" className="text-emerald-500 font-medium">Log In</Link>
              <Link href="/auth/register" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
          <SignInForm />
        </div>
      </div>
    </div>
  );
} 