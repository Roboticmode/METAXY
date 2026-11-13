import { NextResponse } from "next/server";
import { askGrok } from "@/lib/assistant/grok";
import { route } from "@/lib/assistant/router";
import type { AssistantRequest, AssistantResponse } from "@/lib/assistant/types";

export const maxDuration = 30;

/** Owner ↔ METAXY console. Grok with tools when XAI_API_KEY is set, otherwise (or on any failure) the offline router. */
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AssistantRequest>;
  const message = String(body.message ?? "").slice(0, 1000);
  const history = Array.isArray(body.history) ? body.history : [];
  const snapshot = body.snapshot;
  if (!snapshot) return NextResponse.json({ error: "snapshot required" }, { status: 400 });

  let res: AssistantResponse;
  if (process.env.XAI_API_KEY) {
    try {
      res = await askGrok(message, history, snapshot);
    } catch (err) {
      console.warn("[assistant] Grok failed, using scripted router:", err);
      res = route(message, snapshot);
    }
  } else {
    res = route(message, snapshot);
  }
  return NextResponse.json(res);
}
