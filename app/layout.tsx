import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Crunch",
  description: "Official Campus App for ordering food and management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}