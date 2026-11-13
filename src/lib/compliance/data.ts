import type { ComplianceStatus } from "@/lib/agent/types";

/**
 * Business legalities for a South African home bakery run as a side hustle (sole proprietor, no staff).
 * Public guidance summarised for the demo — NOT legal or tax advice. Every task links to the official source.
 */

export type ComplianceCategory = "Identity & tax" | "Registration" | "Banking" | "Licences & permits" | "Data protection (POPIA)" | "Employment";

export type ComplianceTask = {
  id: string;
  label: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  priority: "high" | "medium" | "low";
  /** one line shown in the checklist */
  note: string;
  /** why this matters for *this* business */
  why: string;
  steps: string[];
  /** documents needed — names match `vault` entries */
  docs: string[];
  cost: string;
  time: string;
  where: { label: string; url: string };
  /** what the agent will never do on the owner's behalf */
  ownerMust: string;
  /** task id that has to be done first */
  dependsOn?: string;
};

export const vault = [
  "ID document (Smart ID)",
  "Proof of residential address",
  "SARS income tax number",
  "Menu & price list",
  "Customer list (WhatsApp)",
  "Kitchen photos",
];

/** Certificates that land in the vault once a task is done. */
export const certificates: Record<string, string> = {
  cipc: "CIPC registration certificate",
  coa: "Certificate of acceptability",
  "popia-io": "Information Officer registration",
};

export function currentVault(isDone: (taskId: string) => boolean): string[] {
  return [...vault, ...Object.entries(certificates).filter(([id]) => isDone(id)).map(([, doc]) => doc)];
}

export const complianceTasks: ComplianceTask[] = [
  {
    id: "id",
    label: "Owner ID verified",
    category: "Identity & tax",
    status: "done",
    priority: "high",
    note: "Smart ID captured in document vault",
    why: "Every registration below starts with a verified ID.",
    steps: ["Upload Smart ID card (both sides)"],
    docs: ["ID document (Smart ID)"],
    cost: "Free",
    time: "Done",
    where: { label: "Department of Home Affairs", url: "https://www.dha.gov.za" },
    ownerMust: "—",
  },
  {
    id: "sars-it",
    label: "SARS income tax number",
    category: "Identity & tax",
    status: "done",
    priority: "high",
    note: "Registered as an individual on eFiling — bakery income declared",
    why: "Bakery profit is taxable on top of your salary.",
    steps: ["Register on SARS eFiling", "Link tax number to METAXY"],
    docs: ["ID document (Smart ID)"],
    cost: "Free",
    time: "Done",
    where: { label: "SARS eFiling", url: "https://www.sarsefiling.co.za" },
    ownerMust: "—",
  },
  {
    id: "prov-tax",
    label: "Provisional tax (IRP6)",
    category: "Identity & tax",
    status: "todo",
    priority: "high",
    note: "Non-salary income likely makes you a provisional taxpayer — 2nd payment due end Feb 2027",
    why: "Income that isn't a salary (your bakery profit) is usually taxed through two provisional payments a year, so you don't get a big bill at once.",
    steps: [
      "Agent estimates 12-month bakery profit from order history",
      "Agent drafts the IRP6 estimate (2nd period, ends Feb 2027)",
      "You review the estimate and submit + pay on eFiling",
    ],
    docs: ["SARS income tax number"],
    cost: "Tax on profit (estimate drafted by agent)",
    time: "~30 min",
    where: { label: "SARS — provisional tax", url: "https://www.sars.gov.za/types-of-tax/provisional-tax/" },
    ownerMust: "Submit the IRP6 and make the payment on eFiling yourself",
  },
  {
    id: "cipc",
    label: "CIPC company registration",
    category: "Registration",
    status: "todo",
    priority: "high",
    note: "Needed for larger buyers, supplier credit and a business bank account",
    why: "Cafés, schools and corporates (3 leads on your radar) ask for a registration number before they buy. It also separates the business from you personally.",
    steps: [
      "Agent suggests 3 company names and checks availability",
      "Agent pre-fills a private company (Pty) Ltd with you as sole director, standard MOI",
      "You log in to BizPortal with your own CIPC customer code and pay",
      "CIPC issues your registration certificate (CoR14.3), usually within days",
    ],
    docs: ["ID document (Smart ID)", "Proof of residential address"],
    cost: "R175 CIPC fee (standard Pty) + R50 optional name reservation",
    time: "~1 hour + CIPC processing",
    where: { label: "BizPortal (CIPC)", url: "https://www.bizportal.gov.za" },
    ownerMust: "Log in with your own CIPC customer code, sign and pay the fee",
  },
  {
    id: "bank",
    label: "Business bank account",
    category: "Banking",
    status: "todo",
    priority: "medium",
    note: "Keeps bakery money separate — needs CIPC documents",
    why: "Customers' deposits currently land in your personal account. A business account makes tax, loans and proof of income simple.",
    steps: ["Agent compares 3 low-fee SME accounts", "Agent prepares your document pack", "You open the account in-app or at a branch"],
    docs: ["ID document (Smart ID)", "Proof of residential address", "CIPC registration certificate"],
    cost: "From ~R0–R100/month depending on bank",
    time: "~1 hour",
    where: { label: "Banking Association SA", url: "https://www.banking.org.za" },
    ownerMust: "Open the account and sign the bank's mandate yourself",
    dependsOn: "cipc",
  },
  {
    id: "coa",
    label: "Certificate of acceptability (food premises)",
    category: "Licences & permits",
    status: "todo",
    priority: "high",
    note: "Required to sell food made in your kitchen — municipal environmental health (R638)",
    why: "Regulation R638 requires food premises — including a home kitchen used for selling — to hold a certificate of acceptability.",
    steps: [
      "Agent pre-fills the application with your premises details",
      "Agent prepares a hygiene self-check list (storage, pests, handwashing)",
      "You book and host the environmental health inspection",
    ],
    docs: ["ID document (Smart ID)", "Proof of residential address", "Kitchen photos"],
    cost: "Confirm with City of Johannesburg (often no fee)",
    time: "Inspection booking: 1–3 weeks",
    where: { label: "Dept of Health — R638 regulations", url: "https://www.health.gov.za" },
    ownerMust: "Sign the application and be present for the inspection",
  },
  {
    id: "licence",
    label: "Business licence (perishable foodstuffs)",
    category: "Licences & permits",
    status: "todo",
    priority: "medium",
    note: "Municipal trading licence for selling perishable food",
    why: "Under the Businesses Act, selling perishable food needs a municipal business licence.",
    steps: ["Agent pre-fills the licence application", "You submit at the City of Johannesburg licensing office"],
    docs: ["ID document (Smart ID)", "Proof of residential address", "Certificate of acceptability"],
    cost: "Municipal fee — confirm with City of Johannesburg",
    time: "~2–4 weeks",
    where: { label: "City of Johannesburg", url: "https://www.joburg.org.za" },
    ownerMust: "Submit the application and pay any municipal fee",
    dependsOn: "coa",
  },
  {
    id: "popia-io",
    label: "POPIA — register Information Officer",
    category: "Data protection (POPIA)",
    status: "todo",
    priority: "high",
    note: "You hold customer names, numbers & sensitive notes (allergies, bereavement)",
    why: "POPIA applies to every business that keeps personal information. As the owner you are the Information Officer and must register with the Information Regulator.",
    steps: ["Agent pre-fills the Information Officer registration", "You submit it on the Information Regulator eServices portal"],
    docs: ["ID document (Smart ID)"],
    cost: "Free",
    time: "~15 min",
    where: { label: "Information Regulator", url: "https://inforegulator.org.za" },
    ownerMust: "Submit the registration under your own name",
  },
  {
    id: "popia-consent",
    label: "POPIA — privacy notice & marketing opt-in",
    category: "Data protection (POPIA)",
    status: "todo",
    priority: "medium",
    note: "Re-order nudges on WhatsApp only go to customers who said yes",
    why: "Direct marketing by WhatsApp or SMS needs the customer's consent (POPIA s69). The agent already skips customers without opt-in.",
    steps: [
      "Agent drafts a plain-language privacy notice (what you keep, why, for how long)",
      "Agent adds an opt-in question to the first-order WhatsApp flow",
      "You approve the wording",
    ],
    docs: ["Customer list (WhatsApp)"],
    cost: "Free",
    time: "~10 min",
    where: { label: "POPIA (Act 4 of 2013)", url: "https://popia.co.za" },
    ownerMust: "Approve the notice and opt-in wording",
  },
  {
    id: "bbbee",
    label: "B-BBEE EME sworn affidavit",
    category: "Registration",
    status: "todo",
    priority: "low",
    note: "Corporate buyers ask for it — free for turnover under R10m",
    why: "Rivonia Office Park Catering and similar buyers need your B-BBEE status for their own scorecards.",
    steps: ["Agent fills in the EME affidavit template", "You sign it in front of a commissioner of oaths"],
    docs: ["ID document (Smart ID)", "CIPC registration certificate"],
    cost: "Free",
    time: "~20 min",
    where: { label: "B-BBEE Commission", url: "https://www.bbbeecommission.co.za" },
    ownerMust: "Sign in front of a commissioner of oaths (e.g. at a police station)",
    dependsOn: "cipc",
  },
  {
    id: "vat",
    label: "VAT registration",
    category: "Identity & tax",
    status: "na",
    priority: "low",
    note: "Not required below the R1 million / 12-month threshold — the agent watches turnover",
    why: "Compulsory only above the threshold; voluntary from R50,000.",
    steps: [],
    docs: [],
    cost: "—",
    time: "—",
    where: { label: "SARS — VAT", url: "https://www.sars.gov.za/types-of-tax/value-added-tax/" },
    ownerMust: "—",
  },
  {
    id: "uif",
    label: "UIF & COIDA (employees)",
    category: "Employment",
    status: "na",
    priority: "low",
    note: "Only once you employ someone — e.g. a helper working more than 24 hours a month",
    why: "Employers must register staff for UIF and COIDA. You work alone, so it doesn't apply yet.",
    steps: [],
    docs: [],
    cost: "—",
    time: "—",
    where: { label: "Department of Employment & Labour", url: "https://www.labour.gov.za" },
    ownerMust: "—",
  },
];

/** What the agent hands back after "Prepare with agent". Tasks not listed fall back to their agent steps. */
export const preparedPacks: Record<string, string[]> = {
  cipc: [
    "Name options checked: “Thandi's Bakes (Pty) Ltd” (available), “Thandi Bakes Soweto (Pty) Ltd”, “Kasi Sweet Bakes (Pty) Ltd”",
    "Private company, standard MOI, Thandi Dlamini as sole director & shareholder (100 shares)",
    "Registered address: Soweto, Johannesburg · contact email & cellphone from your profile",
    "BizPortal application pre-filled — ready for your CIPC login",
  ],
  "prov-tax": [
    "12-month bakery turnover R118,400 from order history; ingredient & packaging costs ≈ R52,100",
    "Estimated taxable bakery profit ≈ R66,300 — added to your salary estimate",
    "IRP6 (2nd period, year ending Feb 2027) estimate drafted for your review",
  ],
  coa: [
    "Application pre-filled: home kitchen, Soweto — baked goods, no meat or dairy fillings",
    "Hygiene self-check list prepared: storage, pest control, hand-wash basin, clean water",
    "Kitchen photos attached from vault",
  ],
  "popia-io": ["Information Officer: Thandi Dlamini (owner) · contact details from profile", "Registration form pre-filled for the Information Regulator portal"],
  "popia-consent": [
    "Privacy notice drafted: we keep your name, number & order history to fill your orders; notes like allergies are kept private; ask us to delete anytime",
    "Opt-in question added to first-order flow: “Can we let you know about specials on WhatsApp? Reply YES or NO”",
  ],
  bank: ["Compared 3 low-fee SME accounts (monthly fee, card fees, EFT costs)", "Document pack ready: ID, proof of address, CIPC certificate"],
  licence: ["Business licence application pre-filled (sale of perishable foodstuffs, home premises)"],
  bbbee: ["EME sworn affidavit filled in: turnover under R10m, ownership details from your profile"],
};

/** Upcoming legal dates, relative to the demo date (13 Nov 2026). */
export const deadlines = [
  { when: "Jan 2027", what: "Income tax return (ITR12) — provisional taxpayers", taskId: "sars-it", tone: "info" as const },
  { when: "End Feb 2027", what: "Provisional tax (IRP6) — 2nd period payment", taskId: "prov-tax", tone: "warn" as const },
  { when: "Before you sell more", what: "Certificate of acceptability for your kitchen", taskId: "coa", tone: "warn" as const },
  { when: "Yearly after CIPC", what: "CIPC annual return — within 30 business days of registration anniversary", taskId: "cipc", tone: "neutral" as const },
];

export const COMPLIANCE_SOURCE = "Public guidance from SARS, CIPC, Information Regulator & City of Johannesburg — not legal or tax advice. Always confirm on the official site.";
