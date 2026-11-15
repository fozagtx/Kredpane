import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kredpane — read the contract before you sign it",
  description: "Finds the unfair terms in a consumer contract, scores the risk, and rewrites them.",
  openGraph: {
    title: "Kredpane — read the contract before you sign it",
    description: "Finds the unfair terms in a consumer contract, scores the risk, and rewrites them.",
    images: ["/logo.svg"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}
