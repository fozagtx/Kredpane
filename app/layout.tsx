import type { Metadata } from "next";
import { Provider } from "./providers";

export const metadata: Metadata = {
  title: "Kredpane — instructions rewritten to a reading target",
  description: "Hospital instructions rewritten to a grade level, with every dose, time and phone number verified as intact."
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
