import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ratchet — support replies that improve under evaluation",
  description: "Every reply is scored by an independent panel, and the next reply is rewritten against that score."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
