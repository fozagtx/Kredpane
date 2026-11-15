import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "./providers";

export const metadata: Metadata = {
  title: "Kredpane — read the contract before you sign it",
  description: "Finds the unfair terms in a consumer contract, scores the risk, and rewrites them."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
