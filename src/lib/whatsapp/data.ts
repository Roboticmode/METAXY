import type { Invoice, Project } from "@/lib/agent/types";
import { initialInvoices, initialProjects } from "@/lib/agent/data";

/** All data here is synthetic. */

export type Automation = {
  id: string;
  label: string;
  detail: string;
  template?: string;
  locked?: boolean;
};

export const automations: Automation[] = [
  { id: "faq", label: "Instant FAQ & rate replies", detail: "Rates, turnaround rules, studio hours and banking details — answered from your brief, 24/7" },
  { id: "order_intake", label: "Enquiry & capacity triage", detail: "Client Desk + Planner check university load & term hours, then draft a reply for your approval" },
  { id: "scope_guard", label: "Scope-creep guard", detail: "Compares requests against agreed deliverables and drafts an add-on quote when out of scope" },
  { id: "deposit_reminder", label: "Deposit & invoice chaser", detail: "Books drafts polite EFT reminders for unpaid deposits and overdue invoices (for your approval)", template: "invoice_reminder_v1" },
  { id: "progress_update", label: "Test-week status updates", detail: "Proactively briefs active clients when academic tests tighten studio hours", template: "status_update_v1" },
  { id: "reorder", label: "Dormant client check-in", detail: "Gentle quarterly check-in — opted-in clients only (POPIA s69)", template: "checkin_nudge_v1" },
  { id: "escalate", label: "Hand off complaints & unknowns", detail: "Complaints and bespoke questions go straight to Naledi — never guessed", locked: true },
];

export const defaultAutomations: Record<string, boolean> = Object.fromEntries(automations.map((a) => [a.id, true]));

export const businessHours = "Client Desk replies 24/7 (drafts held for approval) · Studio hours: 8–10 hrs/wk around BSc IS lectures & tests";
export const deliveryArea = "Remote across Johannesburg & SA · WhatsApp + Google Meet · EFT invoicing";
export const bankingDetails = "Naledi Studio · FNB Cheque · Acc 6291 044 8210 · Branch 250655 (demo details)";

export const setupSteps = [
  { id: "number", label: "Studio WhatsApp verified", detail: "+27 82 555 0100 on WhatsApp Business", status: "done" as const },
  { id: "profile", label: "Studio profile & hours", detail: "Naledi Studio · Design & Web · Term-time turnaround notice", status: "done" as const },
  { id: "catalogue", label: "Service packages synced", detail: "Logo kit, Social pack, 3-page website & Add-on rates", status: "done" as const },
  { id: "templates", label: "Message templates approved", detail: "3 of 3 Meta templates ready (reminders, status, check-ins)", status: "done" as const },
  { id: "optin", label: "POPIA opt-in capture", detail: "Ask new clients on first quote (see Compliance › POPIA)", status: "progress" as const },
  { id: "api", label: "Connect WhatsApp Cloud API", detail: "Demo uses the simulator — Cloud API is a drop-in swap", status: "todo" as const },
];

export const seedProjects: Project[] = initialProjects;
export const seedInvoices: Invoice[] = initialInvoices;

export const checkinCandidates = ["c-105"];

type Seed = { from: "customer" | "agent" | "owner"; text: string; at: string };

/** Seeded WhatsApp history across Naledi's 6 clients. */
export const seedThreads: Record<string, Seed[]> = {
  "c-105": [{ from: "customer", text: "Thanks Naledi, the new clinic brochure looks super clean! 🙌", at: "18 Sep" }],
  "c-102": [
    { from: "customer", text: "Got the fleet branding & rate card PDF, thanks.", at: "23 Oct" },
    { from: "agent", text: "Awesome Kagiso! I've attached INV-2041 (R2,400 final balance). EFT details are on the invoice.", at: "23 Oct" },
  ],
  "c-101": [
    { from: "customer", text: "Hey Naledi! Need a Summer Menu Social Pack for Kasi Brew next week if possible.", at: "Mon 10:15" },
    { from: "agent", text: "Hi Kagiso! Planner checked Naledi's week — Mon 16 Nov works for the Summer Menu Social Pack (R850). 50% deposit (R425) locks it in!", at: "Mon 10:16" },
    { from: "customer", text: "Cool, paying the deposit today.", at: "Mon 10:22" },
  ],
  "c-103": [
    { from: "customer", text: "Hi Naledi, excited to see the Dube Physio logo concepts!", at: "Tue 14:05" },
    { from: "owner", text: "Sending the two primary concepts tonight Zanele — business card layout follows right after ✨", at: "Tue 18:40" },
  ],
  "c-104": [
    { from: "customer", text: "Hey, 50% deposit paid for the Nkosi Solar 3-page website. Looking at Wed 25 Nov for milestone review?", at: "Wed 11:30" },
    { from: "agent", text: "Deposit received, thanks Thabo! Pencilled in for Wed 25 Nov — Planner will flag any schedule shifts early.", at: "Wed 11:31" },
  ],
};
