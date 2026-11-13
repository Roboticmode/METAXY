import type { Order } from "@/lib/agent/types";

/** All data here is synthetic. */

export type Automation = {
  id: string;
  label: string;
  detail: string;
  /** business-initiated messages need a WhatsApp-approved template */
  template?: string;
  /** can't be switched off — safety rule */
  locked?: boolean;
};

export const automations: Automation[] = [
  { id: "faq", label: "Instant FAQ answers", detail: "Menu & prices, hours, location and banking details — answered from your brief, 24/7" },
  { id: "order_intake", label: "Order intake", detail: "Reads the order, checks the calendar and your policies, drafts the order" },
  { id: "deposit_reminder", label: "Deposit reminder", detail: "Polite nudge when a deposit is still unpaid after 24h", template: "deposit_reminder_v1" },
  { id: "delivery_reminder", label: "Day-before reminder", detail: "Confirms delivery time & address the day before", template: "delivery_reminder_v1" },
  { id: "thank_you", label: "Thank-you & feedback", detail: "Thanks the customer the day after delivery and asks for a quick review", template: "thank_you_v2" },
  { id: "reorder", label: "Re-order nudge", detail: "Gentle 'craving something sweet?' after 3+ weeks — opted-in customers only (POPIA)", template: "reorder_nudge_v1" },
  { id: "escalate", label: "Hand off to you", detail: "Complaints and questions the agent can't answer are passed to you — never guessed", locked: true },
];

export const defaultAutomations: Record<string, boolean> = Object.fromEntries(automations.map((a) => [a.id, true]));

export const businessHours = "Orders answered 24/7 by the agent · Thandi bakes Mon–Fri after 17:30 and Saturdays 08:00–14:00";
export const deliveryArea = "Soweto, Dobsonville, Meadowlands & Diepkloof (free delivery) — collection in Orlando West";
export const bankingDetails = "Thandi's Bakes · Capitec · Acc 1234 567 890 · Branch 470010 (demo details)";

/** WhatsApp Business account setup. */
export const setupSteps = [
  { id: "number", label: "Business number verified", detail: "+27 82 555 0100 on WhatsApp Business", status: "done" as const },
  { id: "profile", label: "Business profile", detail: "Name, description, hours, address, category: Bakery", status: "done" as const },
  { id: "catalogue", label: "Product catalogue", detail: "4 items synced from your price list", status: "done" as const },
  { id: "greeting", label: "Greeting & away messages", detail: "Handled by the agent instead of fixed text", status: "done" as const },
  { id: "templates", label: "Message templates approved", detail: "4 of 4 approved by Meta — needed for messages the business starts", status: "done" as const },
  { id: "optin", label: "Marketing opt-in capture", detail: "Ask new customers on first order (see Compliance › POPIA)", status: "progress" as const },
  { id: "api", label: "Connect WhatsApp Business Platform", detail: "Demo uses the simulator — Cloud API is a drop-in swap", status: "todo" as const },
];

/** Dates the automations compare against (demo "today" is Fri 13 Nov 2026). */
export const TOMORROW = "2026-11-14";
export const YESTERDAY = "2026-11-12";

/** Orders already in flight before the demo starts — give the automations something real to do. */
export const seedOrders: Order[] = [
  {
    id: "ORD-1031",
    customerId: "c-101",
    customerName: "Naledi Khumalo",
    items: [{ name: "large cake", qty: 1, unit: 550 }],
    total: 550,
    deposit: 0,
    date: "2026-11-14",
    status: "confirmed",
    payment: "EFT on the day (regular)",
  },
  {
    id: "ORD-1029",
    customerId: "c-104",
    customerName: "Lerato Mokoena",
    items: [{ name: "brownie box", qty: 2, unit: 180 }],
    total: 360,
    deposit: 180,
    date: "2026-11-17",
    status: "awaiting_deposit",
    payment: "50% deposit R180 due",
  },
  {
    id: "ORD-1024",
    customerId: "c-105",
    customerName: "Bongani Nkosi",
    items: [{ name: "large cake", qty: 1, unit: 550 }],
    total: 550,
    deposit: 0,
    date: "2026-11-12",
    status: "delivered",
    payment: "Paid on delivery",
  },
];

/** Customers due a re-order nudge (3+ weeks since last order, no open order). */
export const reorderCandidates = ["c-102", "c-103"];

type Seed = { from: "customer" | "agent" | "owner"; text: string; at: string };

/** Earlier conversation history per customer — oldest chat first (the inbox sorts by latest message). */
export const seedThreads: Record<string, Seed[]> = {
  "c-102": [{ from: "customer", text: "Thanks Thandi, the team loved the cupcakes 👌", at: "16 Oct" }],
  "c-103": [{ from: "customer", text: "The nut-free cupcakes were perfect for my son's party, thank you!", at: "24 Oct" }],
  "c-101": [
    { from: "customer", text: "Hi Thandi! Can I get a large red velvet cake for my daughter's birthday on Saturday the 14th? 🎂", at: "Mon 09:12" },
    { from: "agent", text: "Hi Naledi! Saturday 14 Nov is available — 1 × large red velvet cake (R550). As a regular you can pay by EFT on the day. Confirmed! 🎉", at: "Mon 09:12" },
    { from: "customer", text: "Perfect thank you!!", at: "Mon 09:15" },
  ],
  "c-104": [
    { from: "customer", text: "hello can i order 2 brownie boxes for tuesday 17th", at: "Wed 21:40" },
    { from: "agent", text: "Hi Lerato! Tuesday 17 Nov is open — 2 × brownie box (R360). To confirm we ask for a 50% deposit (R180) by EFT. Shall I send the banking details?", at: "Wed 21:40" },
  ],
  "c-105": [
    { from: "customer", text: "Morning Thandi, the cake for the church function on Thursday — can you write 'Happy 25th Rev. Dube' on it?", at: "Tue 07:02" },
    { from: "agent", text: "Morning Bongani! Noted — 'Happy 25th Rev. Dube' on the large cake for Thursday 12 Nov. 🙏", at: "Tue 07:02" },
    { from: "owner", text: "Delivered and they loved it! Thanks Bongani 🙌", at: "Thu 16:30" },
  ],
};
