import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import AppShell from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "MY OS — Personal Operating System",
  description: "Class 12 board exam simulator, AI study planner, English lab, freelance CRM and self-improvement — one intelligent system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
