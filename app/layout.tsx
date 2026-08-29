import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learn Networks · Network repair lab",
  description:
    "A light, interactive network security lab: find weak controls, choose repairs, and rerun a mock pentest until the report is clean.",
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
