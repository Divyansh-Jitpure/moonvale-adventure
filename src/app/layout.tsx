import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moonvale Adventure",
  description: "A 2D adventure game prototype built with Next.js and Phaser.",
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
