import { NextResponse } from "next/server";
import { business } from "@/lib/agent/data";
import {
  assistantSystemPrompt,
  DEFAULT_OPENAI_LIVE_MODEL,
  openaiBaseUrl,
  resolveOpenAIModel,
  resolveReasoningEffort,
  toResponsesTools,
} from "@/lib/assistant/grok";
import type { Snapshot } from "@/lib/assistant/types";

export const maxDuration = 30;

const LIVE_VOICE_INSTRUCTIONS = `You are METAXY Live, the real-time voice assistant for ${business.owner} inside the ${business.name} command centre.
Speak in warm, concise, plain South African English (no emojis, no markdown formatting). Keep spoken responses short (1 to 3 sentences).
For any request involving business data, university schedule, studio prices, switching tabs, opening WhatsApp chats, highlighting panels, preparing compliance paperwork, running scans, or sending/approving messages, delegate to the backend right away and speak the exact grounded result.`;

/**
 * Starts a WebRTC GPT-Live (gpt-live-1) session with Responses delegation (gpt-6-luna on high).
 * Keeps OPENAI_API_KEY strictly on the server and returns only the SDP answer + session metadata.
 */
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server" }, { status: 503 });
  }

  let body: { sdp?: unknown; snapshot?: Snapshot };
  try {
    body = (await req.json()) as { sdp?: unknown; snapshot?: Snapshot };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sdp = typeof body.sdp === "string" ? body.sdp.trim() : "";
  const snapshot = body.snapshot;
  if (!sdp) return NextResponse.json({ error: "WebRTC SDP offer is required" }, { status: 400 });
  if (!snapshot) return NextResponse.json({ error: "Dashboard snapshot is required" }, { status: 400 });

  const liveModel = process.env.OPENAI_LIVE_MODEL?.trim() || DEFAULT_OPENAI_LIVE_MODEL;
  const backendModel = resolveOpenAIModel();
  const effort = resolveReasoningEffort(backendModel);

  const backendInstructions = `${assistantSystemPrompt(snapshot)}
LIVE VOICE MODE:
- Your replies will be spoken aloud by ${liveModel}. Keep them short, clear, and conversational (1 to 3 sentences, plain South African English, no bullet symbols).
- Immediately call UI tools whenever the owner wants to navigate, open a chat or compliance task, highlight a panel, toggle sidebars, prepare compliance, or run Planner/Books scans.
- For ASK-FIRST tools (run_automations, decide_approval, send_owner_message), call the tool so a confirmation card appears on screen, then tell the owner to click Confirm to proceed.
- If the owner asks about anything on screen after earlier voice commands or manual clicks, call get_dashboard_state to read the current live website state.`;

  const upstream = await fetch(`${openaiBaseUrl()}/live/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      session: {
        model: liveModel,
        instructions: LIVE_VOICE_INSTRUCTIONS,
        delegation: {
          type: "responses",
          responses: {
            model: backendModel,
            ...(effort ? { reasoning: { effort } } : {}),
            instructions: backendInstructions,
            tools: toResponsesTools(true),
            tool_choice: "auto",
          },
        },
      },
      transport: {
        type: "webrtc",
        sdp,
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("[live/session] OpenAI live/sessions failed:", upstream.status, errText.slice(0, 400));
    return NextResponse.json(
      { error: `OpenAI Live ${upstream.status}: ${errText.slice(0, 200)}` },
      { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
    );
  }

  const data = (await upstream.json()) as {
    session?: { id?: string; model?: string };
    transport?: { type?: string; sdp?: string };
  };

  return NextResponse.json({
    session: data.session,
    transport: data.transport,
    liveModel,
    backendModel,
    reasoningEffort: effort,
  });
}
