import ElsewhereHero from "@/components/ui/elsewhere-hero";

/**
 * METAXY landing hero — ElsewhereHero configured for our story.
 * Day/night = the owner's day job vs. the business after hours (metaxý: "in between").
 *
 * TODO(landing): the clips below are the component's placeholder footage. Swap in South African
 * day/night footage (e.g. a Joburg street or a township spaza by day and at night) — just change
 * DAY_SRC / NIGHT_SRC. Keep each clip short (≤ 10 s, ≤ 4 MB) so the page loads on mobile data.
 */
const DAY_SRC = "https://cdn.21st.dev/assets/mirror/a6/a639af57ee941fdd518c604efb043501ad0e815dcce9f7efba850998bafa3453.mp4";
const NIGHT_SRC = "https://cdn.21st.dev/assets/mirror/4b/4badf32b0bc920a2fd1b066182eee89e98d8615f680e01fb19ff62fb56e86872.mp4";

export function MetaxyHero() {
  return (
    <ElsewhereHero
      daySrc={DAY_SRC}
      nightSrc={NIGHT_SRC}
      objectPosition="42% 50%"
      brand="METAXY"
      links={[
        { label: "How it works", href: "#how" },
        { label: "Modules", href: "#modules" },
        { label: "Who it's for", href: "#who" },
        { label: "Trust", href: "#trust" },
      ]}
      navCta={{ label: "Open dashboard", href: "/dashboard" }}
      headline="From hustle to formal business."
      subline="An AI agent that answers your customers, chases payments and walks you through CIPC and SARS — with a command centre where you see and approve everything it does."
      primaryCta={{ label: "Try the live demo", href: "/dashboard" }}
      secondaryCta={{ label: "How it works", href: "#how" }}
      sound={false}
      cycleCaption={{ day: "By day: the 9-to-5, lectures, the day job", night: "After hours: the business — METAXY keeps it running" }}
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    />
  );
}
