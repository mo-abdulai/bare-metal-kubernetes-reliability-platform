import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { appConfig } from "@/lib/utils/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "OpsPulse | Infrastructure Reliability & Operations",
  description: "Operational console for the Bare-Metal Kubernetes Reliability & Operations Platform.",
  openGraph: {
    title: "OpsPulse | Infrastructure Reliability & Operations",
    description: "Operational console for the Bare-Metal Kubernetes Reliability & Operations Platform.",
    siteName: appConfig.name,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('opspulse-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
