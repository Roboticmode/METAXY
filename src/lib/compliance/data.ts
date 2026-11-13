import type { ComplianceStatus } from "@/lib/agent/types";

/**
 * Business legalities for a South African student-freelancer sole trader (design & web studio).
 * Public guidance summarised for the demo — NOT legal or tax advice. Every task links to the official source.
 */

export type ComplianceCategory = "Identity & tax" | "Registration" | "Banking" | "Contracts & IP" | "Data protection (POPIA)" | "Employment";

export type ComplianceTask = {
  id: string;
  label: string;
  category: ComplianceCategory;
  status: ComplianceStatus;
  priority: "high" | "medium" | "low";
  note: string;
  why: string;
  steps: string[];
  docs: string[];
  cost: string;
  time: string;
  where: { label: string; url: string };
  ownerMust: string;
  dependsOn?: string;
};

export const vault = [
  "ID document (Smart ID)",
  "Proof of residential address",
  "SARS income tax number",
  "Studio rate card & portfolio",
  "Client list (WhatsApp)",
  "Student registration letter",
];

/** Certificates that land in the vault once a task is done. */
export const certificates: Record<string, string> = {
  cipc: "CIPC registration certificate",
  "client-contract": "Signed standard freelance SLA",
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
    why: "Every registration and bank account starts with a verified ID.",
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
    note: "Registered as an individual on eFiling — freelance income tracked",
    why: "Freelance income above the annual tax threshold must be declared on your ITR12 return.",
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
    note: "Freelance income with no PAYE makes you a provisional taxpayer — 2nd payment due end Feb 2027",
    why: "Clients pay your full invoice without deducting PAYE, so SARS expects two IRP6 estimates a year to avoid penalties.",
    steps: [
      "Books estimates 12-month studio profit from paid invoices & software expenses",
      "Agent drafts the IRP6 estimate (2nd period, ends Feb 2027)",
      "You review the figures and submit + pay on eFiling",
    ],
    docs: ["SARS income tax number"],
    cost: "Tax on profit above annual rebate",
    time: "~30 min",
    where: { label: "SARS — provisional tax", url: "https://www.sars.gov.za/types-of-tax/provisional-tax/" },
    ownerMust: "Submit the IRP6 and make any payment on eFiling yourself",
  },
  {
    id: "cipc",
    label: "CIPC company registration",
    category: "Registration",
    status: "todo",
    priority: "high",
    note: "Unlocks corporate retainers, supplier accounts & a business bank account",
    why: "Larger clients (like Rosebank Dental or Sandton Tax & Books) ask for a registration number before paying deposits.",
    steps: [
      "Agent checks 3 studio name options",
      "Agent pre-fills a private company (Pty) Ltd with you as sole director",
      "You log in to BizPortal with your CIPC customer code and pay",
      "CIPC issues your registration certificate (CoR14.3)",
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
    note: "Separates client EFT deposits from personal student spending — needs CIPC docs",
    why: "Right now client deposits land in your personal cheque account. Separating them simplifies tax deductions and proof of income.",
    steps: ["Agent compares 3 low-fee SME accounts", "Agent prepares your document pack", "You open the account in-app"],
    docs: ["ID document (Smart ID)", "Proof of residential address", "CIPC registration certificate"],
    cost: "From ~R0–R95/month depending on bank",
    time: "~45 min",
    where: { label: "Banking Association SA", url: "https://www.banking.org.za" },
    ownerMust: "Open the account and sign the bank's mandate yourself",
    dependsOn: "cipc",
  },
  {
    id: "client-contract",
    label: "Standard freelance scope & IP agreement",
    category: "Contracts & IP",
    status: "todo",
    priority: "high",
    note: "Defines revision limits, 50% deposit terms, and IP transfer only on full payment",
    why: "Without written deliverables and an IP-on-payment clause, clients request endless free edits or withhold final EFTs.",
    steps: [
      "Client Desk drafts a 1-page plain-English scope & IP clause",
      "Includes 2 revision rounds + out-of-scope change quote rule",
      "You review and adopt it as your default quote attachment",
    ],
    docs: ["ID document (Smart ID)", "Studio rate card & portfolio"],
    cost: "Free (template) — optional attorney review",
    time: "~15 min",
    where: { label: "CIPC — Copyright & IP guide", url: "https://www.cipc.co.za" },
    ownerMust: "Approve the contract terms before sending to clients",
  },
  {
    id: "popia-io",
    label: "POPIA: register Information Officer",
    category: "Data protection (POPIA)",
    status: "todo",
    priority: "medium",
    note: "You store client phone numbers, website credentials & analytics access",
    why: "POPIA applies to sole traders handling client personal details. Registering yourself as Information Officer takes 15 minutes.",
    steps: ["Agent pre-fills Information Officer details", "You submit on the Information Regulator portal"],
    docs: ["ID document (Smart ID)"],
    cost: "Free",
    time: "~15 min",
    where: { label: "Information Regulator", url: "https://inforegulator.org.za" },
    ownerMust: "Submit the registration under your own name",
  },
  {
    id: "popia-consent",
    label: "POPIA: client privacy notice & opt-in",
    category: "Data protection (POPIA)",
    status: "todo",
    priority: "medium",
    note: "Check-in promos on WhatsApp only go to clients who opted in",
    why: "POPIA s69 requires explicit consent before sending promotional WhatsApp follow-ups to dormant clients.",
    steps: ["Agent drafts a short privacy notice for quotes", "Adds opt-in prompt to onboarding", "You approve the wording"],
    docs: ["Client list (WhatsApp)"],
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
    note: "Corporate clients ask for it — free for turnover under R10m",
    why: "Corporate procurement teams need your B-BBEE affidavit on file before approving vendor onboarding.",
    steps: ["Agent fills in the EME affidavit template", "You sign in front of a commissioner of oaths"],
    docs: ["ID document (Smart ID)", "CIPC registration certificate"],
    cost: "Free",
    time: "~20 min",
    where: { label: "B-BBEE Commission", url: "https://www.bbbeecommission.co.za" },
    ownerMust: "Sign in front of a commissioner of oaths",
    dependsOn: "cipc",
  },
  {
    id: "vat",
    label: "VAT registration",
    category: "Identity & tax",
    status: "na",
    priority: "low",
    note: "Not required below R1 million / 12-month threshold — Books watches turnover",
    why: "Compulsory only above R1M/year; voluntary from R50,000.",
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
    note: "Only once you employ staff or subcontractors working >24 hrs/month",
    why: "You operate solo alongside your degree, so employer registrations do not apply yet.",
    steps: [],
    docs: [],
    cost: "—",
    time: "—",
    where: { label: "Department of Employment & Labour", url: "https://www.labour.gov.za" },
    ownerMust: "—",
  },
];

export const preparedPacks: Record<string, string[]> = {
  cipc: [
    "Name options checked: “Naledi Studio (Pty) Ltd” (available), “Naledi Digital ZA (Pty) Ltd”, “Khumalo Creative Lab (Pty) Ltd”",
    "Private company, standard MOI, Naledi Khumalo as sole director & shareholder (100 shares)",
    "Registered address: Johannesburg · contact email & cellphone from profile",
    "BizPortal application pre-filled — ready for your CIPC login",
  ],
  "prov-tax": [
    "12-month studio turnover R92,400 from paid invoices; software & hosting expenses ≈ R8,200",
    "Estimated taxable freelance profit ≈ R84,200 (below primary tax threshold if no other income — still file zero/provisional return cleanly)",
    "IRP6 (2nd period, year ending Feb 2027) draft ready for your review",
  ],
  "client-contract": [
    "1-page Studio SLA drafted: 50% upfront deposit, 2 included revision rounds, extra variations billed via written add-on quote",
    "IP clause included: full source files & copyright transfer upon final EFT clearance",
  ],
  "popia-io": ["Information Officer: Naledi Khumalo (owner) · details from profile", "Pre-filled for Information Regulator eServices portal"],
  "popia-consent": [
    "Privacy notice drafted for client quotes: stored details used solely for design delivery & invoicing",
    "WhatsApp opt-in added for dormant client check-ins",
  ],
  bank: ["Compared 3 zero/low-fee student-friendly SME accounts", "Document pack ready: ID, proof of address, CIPC certificate"],
  bbbee: ["EME sworn affidavit filled in: turnover under R10m, 100% Black woman-owned details from profile"],
};

export const deadlines = [
  { when: "Jan 2027", what: "Income tax return (ITR12) — individual/sole trader", taskId: "sars-it", tone: "info" as const },
  { when: "End Feb 2027", what: "Provisional tax (IRP6) — 2nd period filing", taskId: "prov-tax", tone: "warn" as const },
  { when: "Before next client", what: "Standard freelance scope & IP agreement", taskId: "client-contract", tone: "warn" as const },
  { when: "Yearly after CIPC", what: "CIPC annual return — within 30 business days", taskId: "cipc", tone: "neutral" as const },
];

export const COMPLIANCE_SOURCE = "Public guidance from SARS, CIPC & Information Regulator — not legal or tax advice. Always confirm on the official site.";
