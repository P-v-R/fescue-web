import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fescue Golf Club",
  description: "Private golf simulator club membership",
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
