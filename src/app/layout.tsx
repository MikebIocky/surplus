// src/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { GeistSans } from 'geist/font/sans';

const font = GeistSans;

export const metadata: Metadata = {
  title: "Surplus App",
  description: "Share and discover ingredients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={font.className}>
      <body className="antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
