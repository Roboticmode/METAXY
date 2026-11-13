import type { Customer, Invoice, Project, SchoolItem } from "./types";

/** All data here is synthetic. */
export const DEMO_TODAY = "2026-11-13"; // Friday — hackathon day

export const business = {
  name: "Naledi Studio",
  owner: "Naledi Khumalo",
  area: "Johannesburg",
  degree: "3rd-year BSc Information Systems",
  tagline: "Logos, social kits & small websites · 8–10 hrs/wk during term",
};

export const policies = [
  { code: "P-01", rule: "50% deposit required before starting any new client project" },
  { code: "P-02", rule: "Never promise a delivery date before Planner checks university deadlines & weekly hour cap (10 hrs/wk)" },
  { code: "P-03", rule: "Requests outside agreed deliverables trigger an add-on change quote for owner approval" },
  { code: "P-04", rule: "Do alone: triage, calculate capacity, draft replies/reminders. Ask first: send external messages, quotes, invoices, or move calendar blocks" },
  { code: "P-05", rule: "Academic integrity: never write, edit, or submit university coursework" },
];

export const catalog: Record<string, { price: number; hours: number; deliverables: string[] }> = {
  "logo kit": { price: 1200, hours: 4, deliverables: ["1 primary logo", "2 revision rounds", "PNG + SVG export"] },
  "social pack": { price: 850, hours: 3, deliverables: ["6 Instagram/WhatsApp templates", "1 revision round"] },
  "3-page website": { price: 3200, hours: 8, deliverables: ["Home, Services & Contact pages", "Mobile layout", "WhatsApp CTA"] },
  "logo add-on": { price: 950, hours: 3, deliverables: ["3 extra logo variations", "4-slide Instagram launch pack"] },
};

/** 5 university modules + fixed academic commitments (12 seeded items; subset shown for the 2-week demo window). */
export const schoolModules = ["IS301 Systems Analysis", "IS302 Databases", "IS304 Networks", "CS310 Human-Computer Interaction", "IS399 Capstone"];

export const initialSchoolItems: SchoolItem[] = [
  { id: "sch-1", module: "IS302 Databases", title: "IS302 Term Test 2", kind: "test", date: "2026-11-19", hours: 5, fixed: true },
  { id: "sch-2", module: "IS301 Systems Analysis", title: "UML & Domain Model Assignment", kind: "assignment", date: "2026-11-17", hours: 3, fixed: true },
  { id: "sch-3", module: "IS304 Networks", title: "Lab 6 Practical Sign-off", kind: "lecture", date: "2026-11-18", hours: 2, fixed: true },
  { id: "sch-4", module: "CS310 HCI", title: "Usability Study Block", kind: "assignment", date: "2026-11-24", hours: 3, fixed: false },
  { id: "sch-5", module: "IS399 Capstone", title: "Capstone Milestone 3 Demo", kind: "capstone", date: "2026-11-25", hours: 6, fixed: true },
  { id: "sch-6", module: "IS302 Databases", title: "Revision Study Block", kind: "assignment", date: "2026-11-25", hours: 2, fixed: false },
  { id: "sch-7", module: "IS301 Systems Analysis", title: "Final Exam Block", kind: "exam", date: "2026-12-01", hours: 6, fixed: true },
  { id: "sch-8", module: "IS304 Networks", title: "Final Exam Block", kind: "exam", date: "2026-12-03", hours: 6, fixed: true },
];

/** Freelance capacity per day during term (max 2 hrs/weekday on test weeks, 4 hrs on Sat). */
export const dailyCapacity: Record<string, { maxHours: number; bookedHours: number; reason?: string }> = {
  "2026-11-16": { maxHours: 2, bookedHours: 2, reason: "IS301 assignment prep" },
  "2026-11-17": { maxHours: 2, bookedHours: 2, reason: "UML assignment due" },
  "2026-11-18": { maxHours: 1, bookedHours: 1, reason: "Networks lab + test prep" },
  "2026-11-19": { maxHours: 0, bookedHours: 0, reason: "IS302 Term Test 2 (blocked)" },
  "2026-11-20": { maxHours: 2, bookedHours: 2, reason: "Dube Physio final edits" },
  "2026-11-21": { maxHours: 4, bookedHours: 1, reason: "Saturday studio window" },
  "2026-11-23": { maxHours: 3, bookedHours: 0, reason: "Post-test clear slot" },
  "2026-11-24": { maxHours: 2, bookedHours: 0 },
  "2026-11-25": { maxHours: 0, bookedHours: 2, reason: "COLLISION: IS399 Capstone + Nkosi Solar" },
  "2026-11-26": { maxHours: 3, bookedHours: 0, reason: "Post-capstone clear slot" },
};

/** 6 seeded clients (4 active, 1 dormant, 1 new lead — includes similar-name pair Kagiso Mokoena / Kagiso Molefe). */
export const initialCustomers: Customer[] = [
  {
    id: "c-101",
    name: "Kagiso Mokoena",
    business: "Kasi Brew Coffee",
    phone: "+27 71 555 0101",
    orders: 3,
    lastOrder: "9 Nov",
    tags: ["active", "early payer"],
    notes: ["Pays deposits same day via EFT. Prefers warm, punchy copy."],
    optIn: true,
  },
  {
    id: "c-102",
    name: "Kagiso Molefe",
    business: "Molefe Logistics",
    phone: "+27 83 555 0102",
    orders: 2,
    lastOrder: "23 Oct",
    tags: ["active", "late payer"],
    notes: ["Similar name to Kagiso Mokoena — always match by business (Molefe Logistics).", "INV-2041 is 21 days overdue."],
    optIn: false,
  },
  {
    id: "c-103",
    name: "Zanele Dube",
    business: "Dube Physiotherapy",
    phone: "+27 72 555 0103",
    orders: 2,
    lastOrder: "10 Nov",
    tags: ["active", "brand kit"],
    notes: ["Agreed scope: 1 primary logo, 2 revision rounds, business card only."],
    optIn: true,
  },
  {
    id: "c-104",
    name: "Thabo Nkosi",
    business: "Nkosi Solar",
    phone: "+27 76 555 0104",
    orders: 1,
    lastOrder: "11 Nov",
    tags: ["active", "website"],
    notes: ["3-page website milestone currently lands on Wed 25 Nov (Capstone day!)."],
    optIn: true,
  },
  {
    id: "c-105",
    name: "Amina Patel",
    business: "Patel Optometrists",
    phone: "+27 60 555 0105",
    orders: 2,
    lastOrder: "18 Sep",
    tags: ["dormant"],
    notes: ["Completed clinic brochure in September. Good candidate for Q4 holiday promo check-in."],
    optIn: true,
  },
];

/** Incoming new lead for Scenario 1. */
export const newCustomer: Customer = {
  id: "c-200",
  name: "Buhle Sithole",
  business: "Sithole Events",
  phone: "+27 82 555 0142",
  orders: 0,
  lastOrder: "—",
  tags: ["new lead"],
  notes: [],
  optIn: false,
};

export const initialProjects: Project[] = [
  {
    id: "PRJ-108",
    customerId: "c-103",
    customerName: "Zanele Dube · Dube Physiotherapy",
    title: "Logo Kit & Business Card",
    items: [{ name: "logo kit", qty: 1, unit: 1200 }],
    deliverables: ["1 primary logo", "2 revision rounds", "Business card print file"],
    total: 1200,
    deposit: 600,
    dueDate: "2026-11-20",
    hoursNeeded: 2,
    status: "in_progress",
    payment: "50% deposit R600 paid",
  },
  {
    id: "PRJ-109",
    customerId: "c-104",
    customerName: "Thabo Nkosi · Nkosi Solar",
    title: "3-Page Solar Website",
    items: [{ name: "3-page website", qty: 1, unit: 3200 }],
    deliverables: ["Home, Services & Contact pages", "Quote request form", "WhatsApp CTA"],
    total: 3200,
    deposit: 1600,
    dueDate: "2026-11-25",
    hoursNeeded: 6,
    status: "in_progress",
    payment: "50% deposit R1,600 paid",
  },
  {
    id: "PRJ-106",
    customerId: "c-101",
    customerName: "Kagiso Mokoena · Kasi Brew Coffee",
    title: "Summer Menu Social Pack",
    items: [{ name: "social pack", qty: 1, unit: 850 }],
    deliverables: ["6 Instagram/WhatsApp templates", "1 revision round"],
    total: 850,
    deposit: 425,
    dueDate: "2026-11-16",
    hoursNeeded: 1,
    status: "awaiting_deposit",
    payment: "50% deposit R425 due",
  },
  {
    id: "PRJ-102",
    customerId: "c-102",
    customerName: "Kagiso Molefe · Molefe Logistics",
    title: "Fleet Branding & Rate Card",
    items: [{ name: "logo kit", qty: 1, unit: 1200 }],
    deliverables: ["Primary logo", "2-page rate card PDF"],
    total: 2400,
    deposit: 1200,
    dueDate: "2026-10-23",
    hoursNeeded: 0,
    status: "delivered",
    payment: "Final balance R2,400 OVERDUE (21d)",
  },
];

export const initialInvoices: Invoice[] = [
  { id: "INV-2041", projectId: "PRJ-102", customerId: "c-102", customerName: "Kagiso Molefe · Molefe Logistics", amount: 2400, dueDate: "2026-10-23", daysOverdue: 21, status: "overdue" },
  { id: "INV-2044", projectId: "PRJ-105", customerId: "c-105", customerName: "Amina Patel · Patel Optometrists", amount: 650, dueDate: "2026-11-06", daysOverdue: 7, status: "overdue" },
  { id: "INV-2046", projectId: "PRJ-106", customerId: "c-101", customerName: "Kagiso Mokoena · Kasi Brew Coffee", amount: 425, dueDate: "2026-11-15", daysOverdue: 0, status: "deposit_pending" },
  { id: "INV-2047", projectId: "PRJ-108", customerId: "c-103", customerName: "Zanele Dube · Dube Physiotherapy", amount: 600, dueDate: "2026-11-20", daysOverdue: 0, status: "due_soon" },
  { id: "INV-2039", projectId: "PRJ-101", customerId: "c-101", customerName: "Kagiso Mokoena · Kasi Brew Coffee", amount: 1800, dueDate: "2026-10-12", daysOverdue: 0, status: "paid" },
];

export const presetMessages = [
  {
    label: "1 · Can you do it by Friday?",
    customerId: "c-200",
    text: "hey naledi got your number from a friend. need a 3-page website for Sithole Events urgently, can you do it by next friday?",
  },
  {
    label: "4 · Scope creep request",
    customerId: "c-103",
    text: "Hey Naledi, loving the logo direction! Could you also throw in 3 extra logo variations and an Instagram launch pack before we wrap?",
  },
  { label: "FAQ — rates & packages", customerId: "c-200", text: "hi what are your rates for logos and websites?" },
  { label: "FAQ — banking details", customerId: "c-101", text: "Hi Naledi, please send your banking details so I can EFT the deposit." },
  { label: "Project status", customerId: "c-104", text: "hi is my website still on track?" },
  { label: "Coursework boundary (Never)", customerId: "c-200", text: "hey can you also write my cousin's IS302 database assignment for R500?" },
  { label: "Complaint (hand off)", customerId: "c-102", text: "The rate card PDF font looks blurry on my phone, really unhappy with this." },
];

export const leads = [
  { name: "Braamfontein Vintage Market", type: "Event branding + posters", area: "Braamfontein", km: 3.1, status: "New", fit: 94 },
  { name: "Melville Artisan Bakery", type: "3-page website + WhatsApp menu", area: "Melville", km: 4.8, status: "Outreach drafted", fit: 90 },
  { name: "Soweto Runners Club", type: "Logo kit + race social pack", area: "Orlando West", km: 11.4, status: "New", fit: 84 },
  { name: "Rosebank Dental Studio", type: "Booking landing page", area: "Rosebank", km: 5.9, status: "Contacted", fit: 79 },
  { name: "Parkhurst Pet Groomers", type: "Social templates + loyalty card", area: "Parkhurst", km: 6.4, status: "New", fit: 76 },
  { name: "Sandton Tax & Books", type: "Corporate clean-up deck", area: "Sandton", km: 12.1, status: "Quote requested", fit: 71 },
];

export const TURNOVER = { last12: 92_400, vatThreshold: 1_000_000, voluntaryVat: 50_000 };
