import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Plane } from "lucide-react";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/10">
          <div className="flex flex-col items-center space-y-3 mb-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-800/50 mb-1 ring-1 ring-white/10">
              <Plane className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">AeroManager</h1>
            <p className="text-gray-400 text-sm max-w-sm text-center">
              Create your account to start managing your aero club operations.
            </p>
            <div className="flex gap-8 text-sm pt-1">
              <Link href="/auth/signin" className="text-gray-400 hover:text-white transition-colors">Log In</Link>
              <Link href="/auth/register" className="text-emerald-500 font-medium">Sign Up</Link>
            </div>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
} 