import { business, policies } from "./data";
import { formatDate, mockUnderstand, rand } from "./tools";
import type { Customer, Order, Understanding } from "./types";

export type ComposeCtx =
  | {
      kind: "order_reply";
      customer: Customer;
      understanding: Understanding;
      calendar: { label: string; available: boolean; alternative: string | null };
      policy: { blocked: boolean; deposit: number; returning: boolean };
      order: Order;
    }
  | { kind: "exception_allowed" | "exception_refused"; customer: Customer; order: Order }
  /** answer a repetitive question using only the given facts (FAQ, banking details, order status) */
  | { kind: "info"; customer: Customer; understanding: Understanding; topic: string; facts: string }
  /** the agent can't / mustn't handle this — tell the customer the owner will reply */
  | { kind: "handoff"; customer: Customer; understanding: Understanding; reason: string };

/**
 * Swappable agent "brain". Everything the UI sees comes from AgentEvents emitted by the pipeline,
 * so the Grok Bot / any other framework can replace this without touching the dashboard.
 */
export interface Brain {
  engine: "mock" | "grok";
  understand(text: string): Promise<Understanding>;
  compose(ctx: ComposeCtx): Promise<string>;
}

const first = (name: string) => name.split(" ")[0];

function mockCompose(ctx: ComposeCtx): string {
  const name = first(ctx.customer.name);
  if (ctx.kind === "info") {
    const hello = ctx.understanding.greeting ? `Hi ${name}! ` : `Hi ${name}, thanks for your message. `;
    return `${hello}${ctx.facts}`;
  }
  if (ctx.kind === "handoff") {
    if (ctx.understanding.emotion === "frustrated") {
      return `${name}, I'm really sorry to hear that — that's not the experience we want for you. I've passed this straight to Thandi and she'll personally reply to you shortly. 🙏`;
    }
    return `Thanks ${name}! That's a good question for Thandi herself — I've passed it on and she'll reply as soon as she can.`;
  }
  if (ctx.kind !== "order_reply") {
    if (ctx.kind === "exception_allowed") {
      return `Good news ${name} — Thandi has made a once-off exception. You can pay ${rand(ctx.order.total)} when we deliver. Your order is confirmed for ${ctx.order.date ? formatDate(ctx.order.date) : "your date"}. Again, our condolences. 🤍`;
    }
    return `Thanks for understanding, ${name}. To lock in your date we do need the ${rand(ctx.order.deposit)} deposit (50%) first — you can pay by EFT and send proof here. We'll hold the slot for 24 hours. 🤍`;
  }
  const { understanding: u, calendar, policy, order } = ctx;
  const parts: string[] = [];
  if (u.emotion === "bereavement") parts.push(`${name}, I'm so sorry for your loss. Please accept our condolences. 🤍`);
  else if (!u.greeting) parts.push(`Hi ${name}! Thanks for reaching out to ${business.name}.`);
  else parts.push(`Hi ${name}! Lovely to hear from you.`);

  const itemText = order.items.map((i) => `${i.qty} × ${i.name}${i.qty > 1 ? "s" : ""}`).join(" + ");
  if (calendar.available) parts.push(`${calendar.label} is available for ${itemText} (${rand(order.total)} in total).`);
  else if (calendar.alternative) parts.push(`Unfortunately ${calendar.label} is fully booked, but ${formatDate(calendar.alternative)} is open for ${itemText} (${rand(order.total)}).`);
  else parts.push(`I've noted ${itemText} for ${rand(order.total)}.`);

  if (policy.blocked) {
    parts.push(
      `To confirm, we ask for a 50% deposit (${rand(policy.deposit)}) on first orders, so I can't offer pay-on-delivery myself — but I've asked Thandi whether she can make an exception for you and will come back shortly.`,
    );
  } else if (!policy.returning) {
    parts.push(`To confirm, we ask for a 50% deposit (${rand(policy.deposit)}) by EFT — shall I send the banking details?`);
  } else {
    parts.push(`Since you're a regular, you can pay on delivery. I've confirmed your order!`);
  }
  return parts.join(" ");
}

export const mockBrain: Brain = {
  engine: "mock",
  understand: async (text) => mockUnderstand(text),
  compose: async (ctx) => mockCompose(ctx),
};

/* ----------------------------- Grok (xAI) engine ----------------------------- */

const XAI_URL = "https://api.x.ai/v1/chat/completions";

async function grokChat(messages: { role: string; content: string }[], json: boolean): Promise<string> {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROK_MODEL || "grok-4",
      temperature: 0.4,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`xAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const UNDERSTAND_SYSTEM = `You extract structured data from a WhatsApp message sent to a small South African home bakery.
Today is Friday 2026-11-13. Return ONLY JSON:
{"intent": "order"|"faq_menu"|"faq_hours"|"faq_location"|"banking_details"|"order_status"|"complaint"|"other",
 "greeting": boolean, "emotion": "neutral"|"bereavement"|"urgent"|"frustrated",
 "items": [{"name": "cupcake"|"small cake"|"large cake"|"brownie box", "qty": number}],
 "requestedDate": "YYYY-MM-DD" | null,
 "paymentTerm": "on_delivery"|"deposit"|"unspecified"}
"greeting" is true only if the customer greets first. Resolve weekdays like "next Thursday" to the next upcoming date.
"intent": "order" = wants to place an order; "faq_menu" = asks about products/prices; "faq_hours" = when you work; "faq_location" = where you are / delivery area;
"banking_details" = wants to pay / asks for account details; "order_status" = asks about an existing order; "complaint" = unhappy; "other" = anything else.`;

export const grokBrain: Brain = {
  engine: "grok",
  async understand(text) {
    const raw = await grokChat([{ role: "system", content: UNDERSTAND_SYSTEM }, { role: "user", content: text }], true);
    const parsed = JSON.parse(raw) as Understanding;
    if (!parsed.items?.length) parsed.items = mockUnderstand(text).items;
    if (!parsed.intent) parsed.intent = mockUnderstand(text).intent;
    return parsed;
  },
  async compose(ctx) {
    const system = `You are the WhatsApp assistant for ${business.name} (owner ${business.owner}), a South African home bakery.
Style: warm, brief (max 4 sentences), plain South African English, light emoji at most one. If the customer mentions a loss, open with genuine condolences before business.
Business policies:\n${policies.map((p) => `- ${p.code}: ${p.rule}`).join("\n")}
Never invent prices, dates or policy exceptions: only use the facts in CONTEXT. If CONTEXT says policy.blocked, politely explain the rule and say you've asked the owner about an exception — do NOT grant it.
If CONTEXT.kind is "info", answer using ONLY CONTEXT.facts. If CONTEXT.kind is "handoff", apologise if the customer is unhappy, do not promise refunds or fixes, and say ${business.owner.split(" ")[0]} will reply personally.`;
    const raw = await grokChat([{ role: "system", content: system }, { role: "user", content: `CONTEXT:\n${JSON.stringify(ctx)}\n\nWrite the reply to the customer.` }], false);
    return raw.trim();
  },
};

export function getBrain(): Brain {
  return process.env.XAI_API_KEY ? grokBrain : mockBrain;
}
