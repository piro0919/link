import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { CallProvider } from "@/lib/call/call-context";
import { CallOverlay } from "@/lib/call/call-overlay";
import { IncomingCallDialog } from "@/lib/call/incoming-call-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Link",
    template: "%s | Link",
  },
  description: "LINEライクなメッセージングアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <CallProvider>
            {children}
            <CallOverlay />
            <IncomingCallDialog />
          </CallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
