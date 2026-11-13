import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "METAXY: the AI command centre for South African small businesses. Agents prepare, you decide.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0d08";
const PAPER = "#f5f3ec";
const ACCENT = "#2f9e78";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));

export default async function OpengraphImage() {
  const [interMedium, interSemi, mono] = await Promise.all([
    font("inter/files/inter-latin-500-normal.woff"),
    font("inter/files/inter-latin-600-normal.woff"),
    font("jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `radial-gradient(90% 70% at 85% 110%, rgba(47,158,120,0.28), transparent 60%), radial-gradient(70% 60% at 10% -10%, rgba(255,255,255,0.08), transparent 60%), ${INK}`,
          color: PAPER,
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 18, height: 18, background: PAPER }} />
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "0.3em" }}>METAXY</div>
          </div>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 18, letterSpacing: "0.12em", color: "rgba(245,243,236,0.6)" }}>
            WHATSAPP-FIRST · ZAR · CIPC &amp; SARS AWARE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.045em", maxWidth: 900 }}>
            From hustle to formal business.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: "rgba(245,243,236,0.78)", maxWidth: 900 }}>
            An AI agent runs your WhatsApp customers and admin. A command centre lets you see and approve everything it does.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "JetBrains Mono", fontSize: 18, letterSpacing: "0.1em" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }} />
            <div style={{ color: PAPER }}>AGENTS PREPARE. YOU DECIDE.</div>
          </div>
          <div style={{ color: "rgba(245,243,236,0.6)" }}>GROK BOT JOHANNESBURG HACKATHON</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Inter", data: interSemi, weight: 600, style: "normal" },
        { name: "JetBrains Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
