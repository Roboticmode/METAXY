import type { Customer } from "./types";

/** All data here is synthetic. */
export const DEMO_TODAY = "2026-11-13"; // Friday — hackathon day

export const business = {
  name: "Thandi's Bakes",
  owner: "Thandi Dlamini",
  area: "Soweto, Johannesburg",
  tagline: "After-hours baking · WhatsApp orders",
};

export const policies = [
  { code: "P-01", rule: "50% deposit required before an order is confirmed (new customers)" },
  { code: "P-02", rule: "No pay-on-delivery for first orders. Returning customers (2+ orders) may pay on delivery" },
  { code: "P-03", rule: "Minimum 3 days lead time. Max 4 bake slots per day" },
  { code: "P-04", rule: "Always reply warmly. Never promise what the calendar can't deliver" },
];

export const catalog: Record<string, number> = {
  cupcake: 12,
  "small cake": 300,
  "large cake": 550,
  "brownie box": 180,
};

/** bake slots used per day (capacity 4) */
export const calendarUsed: Record<string, number> = {
  "2026-11-17": 2,
  "2026-11-18": 4, // full
  "2026-11-19": 1, // Thursday — available
  "2026-11-20": 3,
  "2026-11-21": 2,
};
export const CAPACITY = 4;

export const initialCustomers: Customer[] = [
  { id: "c-101", name: "Naledi Khumalo", phone: "+27 71 555 0101", orders: 5, lastOrder: "9 Nov", tags: ["regular", "birthdays"], notes: ["Loves red velvet. Pays by EFT on the day."], optIn: true },
  { id: "c-102", name: "Pieter van Wyk", phone: "+27 83 555 0102", orders: 3, lastOrder: "16 Oct", tags: ["office orders"], notes: ["Orders 24 cupcakes monthly for team meeting."], optIn: false },
  { id: "c-103", name: "Ayesha Patel", phone: "+27 72 555 0103", orders: 2, lastOrder: "24 Oct", tags: ["regular"], notes: ["Nut allergy in family — never use peanuts."], optIn: true },
  { id: "c-104", name: "Lerato Mokoena", phone: "+27 76 555 0104", orders: 1, lastOrder: "11 Nov", tags: ["new"], notes: ["Found us via Facebook community group."], optIn: false },
  { id: "c-105", name: "Bongani Nkosi", phone: "+27 60 555 0105", orders: 4, lastOrder: "12 Nov", tags: ["regular", "church events"], notes: ["Large cakes for church functions."], optIn: true },
];

/** The incoming customer for the hero demo — NEW, no history. */
export const newCustomer: Customer = {
  id: "c-200",
  name: "Sipho Mabaso",
  phone: "+27 82 555 0142",
  orders: 0,
  lastOrder: "—",
  tags: ["new"],
  notes: [],
};

export const presetMessages = [
  {
    label: "Scenario A — off-script order",
    text: "need 40 cupcakes and a small cake for next thursday. my mother passed away last week its for the family gathering. can i pay when you deliver? money is tight right now",
  },
  {
    label: "Polite standard order",
    text: "Hi Thandi! Could I please order 24 cupcakes for Saturday 21 November? I can pay a deposit by EFT.",
  },
  {
    label: "Wednesday is full",
    text: "hi, 1 large cake for wednesday please",
  },
  { label: "FAQ — prices", text: "how much are your cupcakes and cakes?" },
  { label: "FAQ — banking details", text: "Hi, can you send your banking details so I can pay the deposit?" },
  { label: "Is my order ready?", text: "hi is my order still on for tuesday?" },
  { label: "Complaint", text: "The cake I got was terrible, the icing was melted. Very disappointed." },
];

export const leads = [
  { name: "Soweto Spaza Collective", type: "Retail buyer", area: "Orlando East", km: 4.2, status: "New", fit: 92 },
  { name: "Kasi Coffee Corner", type: "Café (wholesale cupcakes)", area: "Diepkloof", km: 6.8, status: "Outreach drafted", fit: 88 },
  { name: "Greenfield Primary Tuck Shop", type: "School tuck shop", area: "Meadowlands", km: 8.1, status: "New", fit: 81 },
  { name: "Rivonia Office Park Catering", type: "Corporate catering", area: "Rivonia", km: 14.6, status: "Contacted", fit: 76 },
  { name: "Mzansi Wedding Planners", type: "Event planner", area: "Roodepoort", km: 12.3, status: "New", fit: 73 },
  { name: "Bakers' Supply Wholesale", type: "Supplier (flour, packaging)", area: "Industria", km: 9.4, status: "Quote requested", fit: 70 },
];

// Compliance checklist lives in src/lib/compliance/data.ts

export const TURNOVER = { last12: 118_400, vatThreshold: 1_000_000, voluntaryVat: 50_000 };
