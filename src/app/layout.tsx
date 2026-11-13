import type { Metadata, Viewport } from "next";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = "METAXY: the AI command centre for South African small businesses";
const DESCRIPTION =
  "An AI agent that runs your WhatsApp customer conversations and admin, with a visual command centre where you see and approve everything it does. From informal hustle to formal business.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · METAXY" },
  description: DESCRIPTION,
  applicationName: "METAXY",
  keywords: ["South Africa", "small business", "WhatsApp", "AI agent", "CIPC", "SARS", "POPIA", "command centre"],
  openGraph: {
    type: "website",
    siteName: "METAXY",
    locale: "en_ZA",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d08",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
