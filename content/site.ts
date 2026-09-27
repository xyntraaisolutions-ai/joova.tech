export const PRICE = 49.99;
export const COUPLE_PACK_PRICE = 89.99;
export const SHIP_DATE = "Nov 18, 2026";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joova.tech";

export const company = {
  brand: "Joova",
  product: "Joova Band",
  legalName: "[CONFIRM: company legal name]",
  address: "[CONFIRM: US business address]",
  email: "hello@joova.tech",
  supportHours: "Weekdays, replies within 24 hours",
};

export const announcement =
  "Pre-order now, ships Nov 18 · Free US shipping · 60-day returns";

export const nav = [
  { href: "/band", label: "Band" },
  { href: "/#box", label: "The box" },
  { href: "/app", label: "App" },
  { href: "/no-subscription", label: "No Subscription" },
  { href: "/help", label: "Help" },
] as const;

export const bandVariants = [
  {
    id: "black",
    name: "Black",
    strap: "Black woven",
    pod: "Graphite",
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
    pod: "Graphite",
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
    pod: "Graphite",
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
    pod: "Graphite",
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
    pod: "Graphite",
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
  "Graphite tracker",
  "Worn woven strap, plus 2 extra straps [CONFIRM colors]",
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
  "Slide the graphite tracker into the woven strap until it sits flush, then fasten the silver buckle.",
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
  { label: "Price", value: "$49.99. No subscription. Ever." },
  { label: "Display", value: "None. Screenless tracker." },
  { label: "Metrics", value: "Sleep, heart-rate trends, activity and steps, HRV trends, blood-oxygen readings. Wellness readings only." },
  { label: "Battery", value: "140mAh. 8–12 days normal use. 5–7 days heavy use. Up to 25–30 days standby." },
  { label: "Charging", value: "Magnetic charging. Full charge in less than 2.5 hours." },
  { label: "Water", value: "[CONFIRM: water resistance rating]. Dry the band before charging." },
  { label: "Fit", value: "[CONFIRM: wrist size range]" },
  { label: "Phone", value: "[CONFIRM: supported phones]" },
  { label: "Health apps", value: "Works with Apple Health and Google Health Connect [CONFIRM]" },
  { label: "Warranty", value: "2 years on the tracker (3rd year free when registered). Lifetime on straps." },
  { label: "Returns", value: "60-day free returns." },
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
    a: "Every box includes 3 straps. Fit range: [CONFIRM: wrist size range].",
  },
  {
    q: "When does it ship?",
    a: "Pre-orders ship November 18, 2026. Free shipping in the United States.",
  },
  {
    q: "What is the return policy?",
    a: "60-day free returns. See the Returns page for how to start a return.",
  },
  {
    q: "What is covered by warranty?",
    a: "Lifetime warranty on straps. 2-year warranty on the tracker, plus a free third year when you register in the app.",
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
  { title: "60-day returns", href: "/returns", copy: "Try it. Send it back if it is not for you." },
  { title: "Lifetime strap warranty", href: "/warranty", copy: "Straps in every box, covered for life." },
  { title: "2-year tracker warranty", href: "/warranty", copy: "Plus a free third year when you register." },
  { title: "Replacement ships first", href: "/warranty", copy: "We send the replacement, then you send the old one." },
  { title: "US-based support", href: "/contact", copy: "Real people. Reply within 24 hours on weekdays." },
  { title: "Secure checkout", href: "/band", copy: "Shop Pay, Apple Pay, and PayPal when checkout goes live." },
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
  { label: "Instagram", href: "https://instagram.com/joova" },
  { label: "TikTok", href: "https://www.tiktok.com/@joova" },
  { label: "YouTube", href: "https://www.youtube.com/@joova" },
  { label: "X", href: "https://x.com/joova" },
];
