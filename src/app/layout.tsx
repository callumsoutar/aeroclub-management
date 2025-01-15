import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/providers/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aero Club Management",
  description: "Manage your aero club with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
