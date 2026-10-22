import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { StudyTimerProvider } from "@/components/study-timer";
import AppShell from "@/components/layout/shell";

export const metadata: Metadata = {
  title: "MY OS — Personal Operating System",
  description: "AI study planner, revision centre, English lab, freelance CRM and self-improvement — one intelligent system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("myos-theme");if(t==="dark"||(t==null&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ToastProvider>
          <StudyTimerProvider>
            <AppShell>{children}</AppShell>
          </StudyTimerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
