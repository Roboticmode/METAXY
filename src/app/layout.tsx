import type { Metadata } from "next";
import { MetaxyProvider } from "@/lib/store";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "METAXY: AI command centre for South African small businesses",
  description: "From informal hustle to formal business. An AI agent plus a visual command centre you can trust.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <MetaxyProvider>{children}</MetaxyProvider>
      </body>
    </html>
  );
}
