import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves the standalone pitch deck (docs/pitch/deck/index.html) and its fonts and screenshots
 * from the app's own origin, so the dashboard can drive it over postMessage. No copy of the deck:
 *   /pitch                   → docs/pitch/deck/index.html (with <base href="/pitch/deck/">)
 *   /pitch/deck/fonts/…      → docs/pitch/deck/fonts/…
 *   /pitch/assets/…          → docs/pitch/assets/…
 * The file still opens on its own from disk.
 */

const ROOT = path.join(process.cwd(), "docs", "pitch");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const parts = (await ctx.params).path ?? [];
  // /pitch/deck too: the deck's #slide hash resolves against <base>, so a reload lands there
  const rel = !parts.length || (parts.length === 1 && parts[0] === "deck") ? "deck/index.html" : parts.join("/");
  const file = path.normalize(path.join(ROOT, rel));
  const ext = path.extname(file).toLowerCase();
  const inside = file.startsWith(path.join(ROOT, "deck") + path.sep) || file.startsWith(path.join(ROOT, "assets") + path.sep);
  if (!inside || !TYPES[ext]) return new Response("Not found", { status: 404 });

  let body: Buffer;
  try {
    body = await readFile(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (ext === ".html") {
    // relative urls (fonts/…, ../assets/…) resolve against the deck folder
    const html = body.toString("utf8").replace("<head>", '<head>\n<base href="/pitch/deck/">');
    return new Response(html, { headers: { "Content-Type": TYPES[ext], "Cache-Control": "no-store" } });
  }
  return new Response(new Uint8Array(body), { headers: { "Content-Type": TYPES[ext], "Cache-Control": "public, max-age=3600" } });
}
