import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studyverse",
  description: "Your personal CA study tracker, synced to your account.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
