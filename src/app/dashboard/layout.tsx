import type { Metadata } from "next";
import { MetaxyProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Command centre: live demo",
  description:
    "The METAXY command centre: watch the agents check a student freelancer's client and university calendars, draft an honest reply, and wait for the owner's approval. All data is synthetic.",
  // The demo is a tool, not a landing page: keep it out of search results.
  robots: { index: false, follow: true },
};

/** The command centre is the only route that needs the client-side store. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <MetaxyProvider>{children}</MetaxyProvider>;
}
