import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn Networks · Northstar security review",
  description:
    "An interactive network security lab: inspect an architecture, find weak configurations, and trace an attack path.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
