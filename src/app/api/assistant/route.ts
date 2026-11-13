import { NextResponse } from "next/server";
import { askGrok, askOpenAI, resolveAssistantProvider } from "@/lib/assistant/grok";
import { route } from "@/lib/assistant/router";
import type { AssistantRequest, AssistantResponse } from "@/lib/assistant/types";

export const maxDuration = 30;

/** Owner ↔ METAXY console. Uses OpenAI or Grok with tools when configured, otherwise (or on failure) the offline router. */
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AssistantRequest>;
  const message = String(body.message ?? "").slice(0, 1000);
  const history = Array.isArray(body.history) ? body.history : [];
  const snapshot = body.snapshot;
  if (!snapshot) return NextResponse.json({ error: "snapshot required" }, { status: 400 });

  const provider = resolveAssistantProvider();
  let res: AssistantResponse;
  if (provider === "openai") {
    try {
      res = await askOpenAI(message, history, snapshot);
    } catch (err) {
      console.warn("[assistant] OpenAI failed, using scripted router:", err);
      res = route(message, snapshot);
    }
  } else if (provider === "grok") {
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
