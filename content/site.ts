import { formatUsd } from "@/lib/utils";

export const PRICE = 49.99;
export const priceLabel = formatUsd(PRICE);
export const COUPLE_PACK_PRICE = 89.99;
export const LAUNCH_SHORT = "Nov 18";
export const PREORDER_SHORT = "Nov 15";
export const SHIP_DATE = "Nov 18, 2026";
export const PREORDER_DEADLINE = "Nov 15, 2026";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joova.tech";

export const company = {
  brand: "Joova",
  product: "Joova Band",
  legalName: "Joova Tech LLC",
  copyright: "© 2026 Joova Tech LLC",
  address: "Grapevine, Texas",
  email: "hello@joova.tech",
  supportHours: "Every message is answered as soon as we can, within 6 to 24 hours.",
};

export const bandImageSize = { width: 864, height: 1152 } as const;
export const boxImageSize = { width: 864, height: 1152 } as const;

export const policies = {
  returnsTitle: "30-day free returns",
  strapTitle: "5-year strap warranty",
  dockTitle: "Dock warranty",
  announcement: `Pre-order ${priceLabel} before ${PREORDER_SHORT} · Launches ${LAUNCH_SHORT} · Free US shipping · 30-day free returns`,
  heroLine:
    "2 straps in every box · 30-day free returns · 5-year strap warranty · 2-year dock warranty",
  strapSummary: "Woven straps are covered for 5 years against manufacturing defects.",
  dockSummary:
    "The dock is covered for 2 years, plus a free third year. Dock warranty applies only after you submit the warranty form.",
  shipping: "Ships from US warehouses. Delivered in 7 to 10 days.",
  returnsSummary:
    "You have 30 days from delivery to start a free return. We cover return shipping in the US.",
} as const;

export const announcement = policies.announcement;

export const nav = [
  { href: "/band", label: "Band" },
  { href: "/#box", label: "The box" },
  { href: "/no-subscription", label: "No Subscription" },
] as const;

export const supportMenu = [
  { href: "/help", label: "FAQs" },
  { href: "/contact", label: "Contact Us" },
  { href: "/app", label: "APP Download" },
] as const;

export const support = {
  email: company.email,
  promise: company.supportHours,
  channels: [
    {
      id: "form",
      label: "Form",
      reply: "within 6 hours",
    },
    {
      id: "email",
      label: "Email",
      reply: "within 12 hours",
      href: `mailto:${company.email}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      reply: "within 6 hours",
      detail: "[CONFIRM: WhatsApp number]",
    },
    {
      id: "sms",
      label: "Text (USA)",
      reply: "within 24 hours",
      detail: "[CONFIRM: US text number]",
    },
  ],
} as const;

export const bandVariants = [
  {
    id: "black",
    name: "Black",
    strap: "Black woven",
    pod: "Black",
    strapHex: "#1E2026",
    boxHex: "#17191E",
    image: "/bands/band-black.png",
    box: "/boxes/box-black.png",
    price: PRICE,
    status: "Pre-order" as const,
  },
  {
    id: "blue",
    name: "Blue",
    strap: "Blue woven",
    pod: "Black",
    strapHex: "#2F6BC8",
    boxHex: "#6C98DD",
    image: "/bands/band-blue.png",
    box: "/boxes/box-blue.png",
    price: PRICE,
    status: "Pre-order" as const,
  },
  {
    id: "green",
    name: "Green",
    strap: "Green woven",
    pod: "Black",
    strapHex: "#2F8A5A",
    boxHex: "#8CC2A2",
    image: "/bands/band-green.png",
    box: "/boxes/box-green.png",
    price: PRICE,
    status: "Pre-order" as const,
  },
  {
    id: "orange",
    name: "Orange",
    strap: "Orange woven",
    pod: "Black",
    strapHex: "#FF8424",
    boxHex: "#F8A765",
    image: "/bands/band-orange.png",
    box: "/boxes/box-orange.png",
    price: PRICE,
    status: "Pre-order" as const,
  },
  {
    id: "red",
    name: "Red",
    strap: "Red woven",
    pod: "Black",
    strapHex: "#D8302E",
    boxHex: "#EF7C75",
    image: "/bands/band-red.png",
    box: "/boxes/box-red.png",
    price: PRICE,
    status: "Pre-order" as const,
  },
] as const;

export type BandVariant = (typeof bandVariants)[number];

export const straps = bandVariants.map((variant) => ({
  id: `strap-${variant.id}`,
  name: `${variant.name} woven strap`,
  material: "Woven",
  color: variant.name,
  hex: variant.strapHex,
  image: variant.image,
  collection: "Launch",
}));

export const boxBack = "/boxes/box-back.png";
export const unboxingImage = "/packaging/unboxing-and-inserts.png";

export const boxFacts = [
  { label: "Type", value: "Rigid two-piece box. Lid and base." },
  { label: "Size", value: "About 12 × 16 × 5 cm [CONFIRM with factory tray]" },
  { label: "Finish", value: "Soft-touch matte. Gloss spot on the logo." },
  { label: "Colors", value: "One design, five colors. The box matches the band inside." },
  { label: "Front", value: "joova. wordmark, BAND, product photo, “No subscription. Ever.”" },
  { label: "Side", value: "Sleep · Heart · Activity" },
  { label: "Inside the lid", value: "Hello. No monthly bills here." },
];

export const inTheBox = [
  "Black tracker",
  "Worn woven strap, plus 1 extra strap. You choose both colors when you order.",
  "Magnetic charger",
  "Quick start, promise card, help card, French guide",
];

export const batteryFacts = [
  { label: "Battery", value: "140mAh" },
  { label: "Normal use", value: "8–12 days" },
  { label: "Heavy use", value: "5–7 days" },
  { label: "Standby", value: "Up to 25–30 days" },
  { label: "Charging", value: "Less than 2.5 hours, magnetic" },
] as const;

export const useSteps = [
  "Charge the band with the magnetic charger before the first wear. A full charge takes less than 2.5 hours.",
  "Slide the black tracker into the woven strap until it sits flush, then fasten the silver buckle.",
  "Wear it for sleep, daily activity, and the day. Open the Joova app when you want the details.",
  "Charge again when the app asks. Normal use lasts 8–12 days. Heavy, all-day and overnight use lasts 5–7 days.",
] as const;

export const careNotes = [
  {
    title: "Handling",
    body: "Wipe the woven strap after sweat or a rinse. Keep the magnetic contacts clean and dry.",
  },
  {
    title: "Charging",
    body: "Set the tracker on the magnetic charger. A full charge takes less than 2.5 hours. Charge it only when it is dry.",
  },
  {
    title: "Water",
    body: "Water resistance rating [CONFIRM]. Dry the band completely before charging. Do not charge it while it is wet.",
  },
] as const;

export const specs = [
  { label: "Price", value: `${priceLabel} pre-order, before ${PREORDER_DEADLINE}. No subscription. Ever.` },
  { label: "Display", value: "None. Screenless tracker." },
  { label: "Metrics", value: "Sleep, heart-rate trends, activity and steps, HRV trends, blood-oxygen readings. Wellness readings only." },
  { label: "Battery", value: "140mAh. 8–12 days normal use. 5–7 days heavy use. Up to 25–30 days standby." },
  { label: "Charging", value: "Magnetic charging. Full charge in less than 2.5 hours." },
  { label: "Water", value: "[CONFIRM: water resistance rating]. Dry the band before charging." },
  { label: "Fit", value: "[CONFIRM: wrist size range]" },
  { label: "Phone", value: "[CONFIRM: supported phones]" },
  { label: "Health apps", value: "Works with Apple Health and Google Health Connect [CONFIRM]" },
  { label: "Strap warranty", value: "5 years against manufacturing defects." },
  { label: "Dock warranty", value: "2 years, plus a free third year. Applies after you submit the warranty form." },
  { label: "Shipping", value: "Ships from US warehouses. Delivered in 7 to 10 days. Free in the United States." },
  { label: "Returns", value: "30-day free returns. US return shipping is covered." },
];

export const faqs = [
  {
    q: "Does it need a subscription?",
    a: "No. Every feature in the Joova app is included with the band. We will never charge a monthly fee for features you bought with your band.",
  },
  {
    q: "Which phones does it work with?",
    a: "[CONFIRM: supported phones]. The app is planned for iOS and Android.",
  },
  {
    q: "How long does the battery last?",
    a: "The 140mAh battery lasts 8–12 days in normal use and 5–7 days in heavy use. Standby is up to 25–30 days.",
  },
  {
    q: "How do I charge it?",
    a: "Magnetic charging. A full charge takes less than 2.5 hours. Dry the band before you charge it.",
  },
  {
    q: "Is it water resistant?",
    a: "Water resistance rating [CONFIRM]. Dry the band completely before charging, and do not charge it while it is wet.",
  },
  {
    q: "What sizes are included?",
    a: "Every box includes 2 straps: the one you wear and 1 extra. You choose both colors when you order. Fit range: [CONFIRM: wrist size range].",
  },
  {
    q: "When does it ship?",
    a: "Joova Band launches November 18, 2026. Pre-order before November 15, 2026. It ships from US warehouses, and delivery takes 7 to 10 days. Free shipping in the United States.",
  },
  {
    q: "What is the return policy?",
    a: "30-day free returns from delivery. US return shipping is covered. See the Returns page for how to start a return.",
  },
  {
    q: "What is covered by warranty?",
    a: "Straps: 5 years against manufacturing defects. Dock: 2 years, plus a free third year. The dock warranty applies only after you submit the warranty form.",
  },
  {
    q: "How is my data handled?",
    a: "Your data is stored in the US and never sold. See the Privacy policy for details.",
  },
];

export const dayStory = [
  {
    id: "morning",
    title: "Morning readiness",
    copy: "Wake up to a simple picture of how you slept and how ready you feel for the day. Wellness insights only — not a diagnosis.",
    metric: "Sleep trends from the night before.",
  },
  {
    id: "active",
    title: "Active day",
    copy: "Track movement without a screen on your wrist. Glance at your phone when you want the details.",
    metric: "Activity and steps.",
  },
  {
    id: "evening",
    title: "Evening wind-down",
    copy: "See how the day added up. Heart-rate trends and recovery cues, in plain language.",
    metric: "Heart-rate and HRV trends.",
  },
  {
    id: "sleep",
    title: "Sleep",
    copy: "A screenless band at night. Sleep and recovery trends in the morning, not a glowing display in bed.",
    metric: "Overnight sleep tracking.",
  },
] as const;

export const appScreens = [
  { id: "sleep", title: "Sleep", copy: "Overnight trends, not a medical report." },
  { id: "activity", title: "Activity", copy: "Steps, movement, and time on your feet." },
  { id: "heart", title: "Heart rate", copy: "Heart-rate trends through the day." },
  { id: "trends", title: "Trends", copy: "Week-over-week patterns you can actually use." },
];

export const trustItems = [
  { title: "30-day free returns", href: "/returns", copy: "30 days from delivery. US return shipping is covered." },
  { title: "5-year strap warranty", href: "/warranty", copy: "Manufacturing defects on the woven straps, for five years." },
  { title: "Dock warranty", href: "/warranty", copy: "2 years on the dock, plus a free third year, after you submit the warranty form." },
  { title: "Replacement ships first", href: "/warranty", copy: "We send the replacement, then you send the old one." },
  { title: "US-based support", href: "/contact", copy: "Real people. Every message gets a reply within 6 to 24 hours." },
  { title: "Secure checkout", href: "/band", copy: "American Express, Visa, Mastercard, Apple Pay, Google Pay, Shop Pay, PayPal, Bancontact, and Wero." },
];

export const helpArticles = [
  {
    slug: "setup",
    title: "Set up your Joova Band",
    summary: "Unbox, charge, pair, and put on your first strap.",
    body: "Charge the band on the magnetic charger before the first wear. A full charge takes less than 2.5 hours.\n\nOpen the Joova app and follow the pairing steps. Slide the tracker into the woven strap until it sits flush, then fasten the buckle.\n\nNormal use lasts 8–12 days. Heavy use lasts 5–7 days.",
  },
  {
    slug: "charging",
    title: "Charging",
    summary: "Magnetic charging in less than 2.5 hours.",
    body: "Joova Band uses magnetic charging. Set the tracker on the charger until it is full. A full charge takes less than 2.5 hours.\n\nThe battery is 140mAh. Dry the band first. Do not charge it while it is wet, and keep the contacts clean.",
  },
  {
    slug: "battery",
    title: "Battery life",
    summary: "140mAh. 8–12 days normal, 5–7 days heavy.",
    body: "Joova Band has a 140mAh battery.\n\nNormal use lasts 8–12 days. Heavy use, with tracking through the day and night, lasts 5–7 days. Standby is up to 25–30 days.\n\nCharge it with the magnetic charger. A full charge takes less than 2.5 hours.",
  },
  {
    slug: "handling",
    title: "Handling",
    summary: "How to wear, wipe, and look after the band.",
    body: "Wear the woven loop on your wrist and fasten the silver buckle so the tracker sits flat.\n\nWipe the strap after sweat. Keep the magnetic contacts clean and dry. Charge the band only when it is dry.\n\nSwap straps by sliding the tracker out of one loop and into the next until it sits flush.",
  },
  {
    slug: "water",
    title: "Water",
    summary: "Dry the band before you charge it.",
    body: "The official water resistance rating is still being confirmed.\n\nDry the band completely before charging. Do not charge it while it is wet. Wipe the strap and the magnetic contacts after sweat or a rinse.",
  },
  {
    slug: "strap-swap",
    title: "Swap a strap",
    summary: "Change colors in a few seconds.",
    body: "Pinch the strap near the tracker, slide the pod out, and slide it into the next strap until it sits flush.",
  },
  {
    slug: "syncing",
    title: "Syncing",
    summary: "Keep the app up to date.",
    body: "Open the app with Bluetooth on. Syncing happens in the background when your phone is nearby. [CONFIRM: any extra pairing notes].",
  },
];

export const calculatorDefaultMonthly = 10;

export const socialLinks = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com/joova" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com/joova" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/@joova" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@joova" },
  { id: "pinterest", label: "Pinterest", href: "https://www.pinterest.com/joova" },
] as const;

export const paymentMethods = [
  { id: "amex", label: "American Express" },
  { id: "apple-pay", label: "Apple Pay" },
  { id: "bancontact", label: "Bancontact" },
  { id: "google-pay", label: "Google Pay" },
  { id: "wero", label: "Wero" },
  { id: "mastercard", label: "Mastercard" },
  { id: "paypal", label: "PayPal" },
  { id: "shop", label: "Shop Pay" },
  { id: "visa", label: "Visa" },
] as const;
