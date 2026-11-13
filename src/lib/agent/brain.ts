import { business, catalog, policies } from "./data";
import { formatDate, mockUnderstand, rand } from "./tools";
import type { Customer, Invoice, Project, SchoolItem, Understanding } from "./types";

export type ComposeCtx =
  | {
      kind: "enquiry_reply";
      customer: Customer;
      understanding: Understanding;
      capacity: { label: string; available: boolean; blocker: string | null; proposedDate: string };
      project: Project;
    }
  | { kind: "scope_quote"; customer: Customer; project: Project; addOnTotal: number; addOnText: string }
  | { kind: "collision_extension"; customer: Customer; project: Project; school: SchoolItem; newDate: string }
  | { kind: "invoice_reminder"; customer: Customer; invoice: Invoice }
  | { kind: "exam_notice"; customer: Customer; project: Project }
  | { kind: "info"; customer: Customer; understanding: Understanding; topic: string; facts: string }
  | { kind: "handoff"; customer: Customer; understanding: Understanding; reason: string }
  | { kind: "academic_refusal"; customer: Customer };

/**
 * Swappable agent "brain". Everything the UI sees comes from AgentEvents emitted by the pipeline,
 * so Grok Bot / any external runtime can replace this without touching the dashboard.
 */
export interface Brain {
  engine: "mock" | "grok" | "openai";
  understand(text: string): Promise<Understanding>;
  compose(ctx: ComposeCtx): Promise<string>;
}

const first = (name: string) => name.split(" ")[0];

function mockCompose(ctx: ComposeCtx): string {
  const name = first(ctx.customer.name);
  switch (ctx.kind) {
    case "academic_refusal":
      return `Hi ${name} — I can help organise study time or client projects, but I never write, edit, or complete university assignments or coursework. Let me know if you need studio design work instead!`;
    case "info": {
      const hello = ctx.understanding.greeting ? `Hi ${name}! ` : `Hi ${name}, thanks for reaching out. `;
      return `${hello}${ctx.facts}`;
    }
    case "handoff":
      if (ctx.understanding.emotion === "frustrated") {
        return `${name}, I'm really sorry about the blurry export — that's on us to fix fast. I've flagged this straight for Naledi and she'll reply personally shortly. 🙏`;
      }
      return `Thanks ${name}! I've passed this note to Naledi so she can respond directly.`;
    case "scope_quote":
      return `Hi ${name}! Glad you're loving the logo direction ✨ Just checking against our agreed brief (${ctx.project.deliverables.join(", ")}), ${ctx.addOnText} sits outside the original scope. I can add it as an add-on package for ${rand(ctx.addOnTotal)} (50% deposit ${rand(Math.round(ctx.addOnTotal * 0.5))}) — want me to lock that in?`;
    case "collision_extension":
      return `Hi ${name}, quick heads-up on ${ctx.project.title} — I have a fixed university ${ctx.school.title} on ${formatDate(ctx.school.date)}, and I don't want to rush your build. Can we deliver on ${formatDate(ctx.newDate)} (+1 day) so it gets my full focus? Let me know if that works!`;
    case "invoice_reminder":
      return `Hi ${name}, hope ${ctx.customer.business} is having a good week! Friendly nudge that ${ctx.invoice.id} (${rand(ctx.invoice.amount)}) is ${ctx.invoice.daysOverdue} days past due. Could you send through proof of payment when you get a moment? EFT: FNB Acc 6291 044 8210 (ref ${ctx.invoice.id}). 🙏`;
    case "exam_notice":
      return `Hi ${name}, quick heads-up: Naledi is entering university exam block (1–4 Dec), so new project intake is paused until 5 Dec. Your active project (${ctx.project.title}) stays on schedule — message anytime for status!`;
    case "enquiry_reply": {
      const { understanding: u, capacity, project } = ctx;
      const greet = !u.greeting ? `Hi ${name}! Thanks for contacting ${business.name}.` : `Hi ${name}!`;
      if (capacity.available) {
        return `${greet} ${capacity.label} works for ${project.title} (${rand(project.total)}). A 50% deposit (${rand(project.deposit)}) by EFT locks in the slot — shall I send banking details?`;
      }
      return `${greet} I checked Naledi's studio & university calendar — next week has a database test on Thursday so ${capacity.label} isn't realistic without rushing. We can deliver cleanly on ${formatDate(capacity.proposedDate)} for ${rand(project.total)} (50% deposit ${rand(project.deposit)} to book). Does Monday work?`;
    }
  }
}

export const mockBrain: Brain = {
  engine: "mock",
  understand: async (text) => mockUnderstand(text),
  compose: async (ctx) => mockCompose(ctx),
};

/* ------------------------- OpenAI & Grok (xAI) engines ------------------------- */

type ChatProvider = {
  label: string;
  url: string;
  apiKey: string;
  model: string;
};

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const openaiUrl = () => `${(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;
const supportsTemperature = (model: string) => !/^(o[134]|gpt-5)/i.test(model);

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

async function chatCompletion(provider: ChatProvider, messages: { role: string; content: string }[], json: boolean): Promise<string> {
  const res = await fetch(provider.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify({
      model: provider.model,
      ...(supportsTemperature(provider.model) ? { temperature: 0.4 } : {}),
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${provider.label} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return String(data.choices?.[0]?.message?.content ?? "");
}

const UNDERSTAND_SYSTEM = `You extract structured intent from a WhatsApp message sent to ${business.name} (a South African student-freelancer design & web studio).
Today is Friday 2026-11-13. Return ONLY JSON:
{"intent": "order"|"scope_change"|"faq_rates"|"faq_hours"|"faq_location"|"banking_details"|"order_status"|"complaint"|"academic_integrity"|"other",
 "greeting": boolean, "emotion": "neutral"|"bereavement"|"urgent"|"frustrated",
 "items": [{"name": "logo kit"|"social pack"|"3-page website"|"logo add-on", "qty": number}],
 "requestedDate": "YYYY-MM-DD" | null,
 "paymentTerm": "on_delivery"|"deposit"|"unspecified"}
If the user asks to write, edit, or complete university coursework/assignments/exams, return intent "academic_integrity".
If an existing client asks for extra deliverables beyond their agreed scope, return intent "scope_change".`;

function makeLlmBrain(engine: "openai" | "grok", getProvider: () => ChatProvider): Brain {
  return {
    engine,
    async understand(text) {
      const raw = await chatCompletion(
        getProvider(),
        [
          { role: "system", content: UNDERSTAND_SYSTEM },
          { role: "user", content: text },
        ],
        true,
      );
      const parsed = JSON.parse(stripJsonFences(raw)) as Understanding;
      if (!parsed.items?.length) parsed.items = mockUnderstand(text).items;
      if (!parsed.intent) parsed.intent = mockUnderstand(text).intent;
      return parsed;
    },
    async compose(ctx) {
      const system = `You are Client Desk / Books / Planner for ${business.name} (owner ${business.owner}, ${business.degree} in ${business.area}).
Style: crisp, warm, honest, brief (max 4 sentences), South African English, ZAR amounts.
Studio policies:\n${policies.map((p) => `- ${p.code}: ${p.rule}`).join("\n")}
Available packages: ${Object.entries(catalog).map(([k, v]) => `${k} ${rand(v.price)}`).join(", ")}.
Never invent dates, prices, or promises: only use facts from CONTEXT. If CONTEXT.kind is "academic_refusal", firmly refuse coursework help.`;
      const raw = await chatCompletion(
        getProvider(),
        [
          { role: "system", content: system },
          { role: "user", content: `CONTEXT:\n${JSON.stringify(ctx)}\n\nDraft the WhatsApp message.` },
        ],
        false,
      );
      return raw.trim();
    },
  };
}

export const openaiBrain: Brain = makeLlmBrain("openai", () => ({
  label: "OpenAI",
  url: openaiUrl(),
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL || "gpt-4o-mini",
}));

export const grokBrain: Brain = makeLlmBrain("grok", () => ({
  label: "xAI",
  url: XAI_URL,
  apiKey: process.env.XAI_API_KEY ?? "",
  model: process.env.GROK_MODEL || "grok-4",
}));

export function getBrain(): Brain {
  const pref = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (pref === "mock" || pref === "scripted") return mockBrain;
  if (pref === "grok" && process.env.XAI_API_KEY) return grokBrain;
  if (pref === "openai" && process.env.OPENAI_API_KEY) return openaiBrain;
  if (process.env.OPENAI_API_KEY) return openaiBrain;
  if (process.env.XAI_API_KEY) return grokBrain;
  return mockBrain;
}
