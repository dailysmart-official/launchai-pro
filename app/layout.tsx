import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaunchAI Pro — AI Writing & Launch Platform",
  description: "Generate high-converting copy, ship faster, and scale with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
