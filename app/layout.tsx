import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kredpane — independent agent underwriting",
  description: "Evaluate an AI agent's behaviour before you give it real-world permissions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
