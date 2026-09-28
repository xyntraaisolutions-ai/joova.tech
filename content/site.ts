import { formatUsd } from "@/lib/utils";

export const PRICE = 59.99;
export const priceLabel = formatUsd(PRICE);
export const RING_PRICE = 69.99;
export const ringPriceLabel = formatUsd(RING_PRICE);
export const SHARE_PRICE = 39.99;
export const sharePriceLabel = formatUsd(SHARE_PRICE);
export const STRAP_PRICE = 7.99;
export const strapPriceLabel = formatUsd(STRAP_PRICE);
export const GLASSES_PRICE = 89.99;
export const glassesPriceLabel = formatUsd(GLASSES_PRICE);
export const BUDS_PRICE = 24.99;
export const budsPriceLabel = formatUsd(BUDS_PRICE);
export const WATCH_PRICE = 12.99;
export const watchPriceLabel = formatUsd(WATCH_PRICE);
export const COUPLE_PACK_PRICE = 89.99;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://joova.tech";

export const noSubscription = "No subscription needed. Ever.";

export const siteDescription =
  "Joova brings smart, simple and fairly priced technology into everyday life. Built by Joova Tech LLC in the USA, every Joova product is designed to be easy to use and worth it. Smarter Tech | Bigger Tomorrow. No subscription. Ever.";

export const company = {
  brand: "Joova",
  product: "Joova",
  legalName: "Joova Tech LLC",
  copyright: "© 2026 Joova Tech LLC",
  address: "Grapevine, Texas",
  email: "support@joova.tech",
  supportHours: "Every message is answered as soon as we can, within 6 to 24 hours.",
};

export const bandImageSize = { width: 1600, height: 1600 } as const;
export const bandBannerSize = { width: 1920, height: 900 } as const;
export const bandLineupSize = { width: 2845, height: 980 } as const;
export const boxImageSize = { width: 864, height: 1152 } as const;

export const policies = {
  returnsTitle: "30-day free returns",
  strapTitle: "Lifetime strap warranty",
  dockTitle: "Tracker warranty",
  announcement: "Free US shipping · 30-day free returns",
  heroLine:
    "2 straps in every box · 30-day free returns · Lifetime strap warranty · 2-year tracker warranty",
  strapSummary:
    "Woven straps are covered for life against manufacturing defects, after the band is registered.",
  dockSummary:
    "The tracker is covered for 2 years, plus a third year, after you register the band.",
  shipping: "Ships from US warehouses. Delivered in 7 to 10 days.",
  returnsSummary:
    "You have 30 days from delivery to start a free return in the United States. We cover return shipping. This is the only free return window.",
  warrantyRegistration:
    "Warranty starts only after the product is registered. Sign up for a Joova Customer Account, then register each eligible product.",
  accountSummary:
    "Your Joova Customer Account keeps purchase history, order tracking, returns, and replacements in one place.",
} as const;

export const announcement = policies.announcement;

export const shareImageSize = { width: 1024, height: 520 } as const;

export const shareBuds = [
  { name: "Sport Clips", detail: "Clip-on buds for a secure fit." },
  { name: "Pro In-Ear", detail: "Stem-style in-ear buds." },
  { name: "Comfort Pods", detail: "Rounded pods for everyday listening." },
  { name: "Mini Sleep Buds", detail: "The smallest pair in the case." },
] as const;

export const shareFacts = [
  { label: "Availability", value: "Available now. Ships from US warehouses in 7 to 10 days." },
  { label: "Price", value: sharePriceLabel },
  { label: "In the case", value: "4 pairs, 8 buds total, in one power case." },
  { label: "Display", value: "Digital LED battery display on the case." },
  {
    label: "Listening",
    value:
      "All 8 buds can link to one phone, tablet, or laptop at the same time. Pairs can also run on separate devices.",
  },
  { label: "Bluetooth", value: "5.3. About 10 m range." },
  { label: "Playtime", value: "Up to 5 hours per pair." },
  { label: "Case", value: "USB-C. About 20 hours of extra charge for the set." },
  { label: "Calls", value: "Built-in microphones. Touch controls on each pair." },
  { label: "Water", value: "IPX4. Sweat and light rain. Not for swimming." },
  {
    label: "In the box",
    value: "Joova Share Pod, 4 pairs of earbuds, USB-C cable, ear tips, quick start guide.",
  },
  { label: "Warranty", value: "1 year after you register the product in your Joova Customer Account." },
  { label: "App", value: "No app needed. Pair in your device's Bluetooth settings." },
] as const;

export const glassesImageSize = { width: 1600, height: 1600 } as const;
export const glassesBannerSize = { width: 1920, height: 900 } as const;

export const glassesFeatures = [
  {
    title: "8MP camera, hands free",
    detail: "Capture 3280 × 2464 photos and stabilized video from your point of view.",
  },
  {
    title: "Ask about what you see",
    detail: "Say the wake word and ask the AI assistant to identify objects or answer questions.",
  },
  {
    title: "Live translation",
    detail: "Text translation, conversation translation, simultaneous interpretation, and face-to-face mode.",
  },
  {
    title: "Clear calls and voice commands",
    detail: "Dual microphones with noise reduction.",
  },
  {
    title: "Wi-Fi transfer",
    detail: "Move photos, videos, and recordings to your phone.",
  },
  {
    title: "Built for every day",
    detail: "IP65 dust, sweat, and splash resistant. Button and touch controls. Not for swimming or showering.",
  },
  {
    title: "No subscription needed. Ever.",
    detail: "Every feature in the Joova app, including the AI assistant, is included for the life of the glasses.",
  },
] as const;

export const glassesFacts = [
  { label: "Availability", value: "Available now. Ships from US warehouses in 7 to 10 days." },
  { label: "Price", value: glassesPriceLabel },
  { label: "Frame", value: "Matte Black TR90. About 168.5 × 156.5 mm." },
  { label: "Lenses", value: "Clear blue-light filtering, or photochromic lenses that darken in sun." },
  { label: "Camera", value: "8MP, 3280 × 2464, anti-shake for photo and video." },
  { label: "Storage", value: "2GB built in." },
  { label: "Connectivity", value: "Wi-Fi 6 for photo and video transfer. Bluetooth 6.0." },
  { label: "Microphones", value: "Dual, with noise reduction." },
  { label: "Controls", value: "Button and touch." },
  { label: "Voice", value: "Wake word: Hey Joova." },
  { label: "Water", value: "IP65. Dust, sweat, and splash. Not for swimming or showering." },
  {
    label: "Battery",
    value: "290mAh. Up to 96 hours standby, about 11 hours of music, about 60 minutes of continuous video.",
  },
  { label: "Charging", value: "USB-C. About 80 minutes, or about 50 minutes on fast charge." },
  { label: "Weight", value: "38 g." },
  { label: "Prescription", value: "Lenses are replaceable. An optician can fit prescription lenses." },
  { label: "App", value: "Joova app. iPhone with iOS 13 or later, Android 7.0 or later." },
  { label: "In the box", value: "Joova Glasses, USB-C cable, glasses case, cleaning cloth, quick start guide." },
  { label: "Warranty", value: "1 year after you register the product in your Joova Customer Account." },
  { label: "Returns", value: "30-day returns." },
  { label: "Subscription", value: `${noSubscription} AI features stay included for the life of the glasses.` },
] as const;

export const glassesFaqs = [
  {
    q: "Do I need a subscription?",
    a: "No. Every feature in the Joova app, including the AI assistant, is included for the life of the glasses.",
  },
  {
    q: "Do they work with iPhone and Android?",
    a: "Yes, with the free Joova app. iPhone needs iOS 13 or later. Android needs 7.0 or later.",
  },
  {
    q: "Can I use prescription lenses?",
    a: "Yes. The lenses are replaceable. Ask an optician to fit prescription lenses in the frame.",
  },
  {
    q: "How do people know when I am recording?",
    a: "A light on the frame turns on while the camera is recording. Record only where it is allowed, and let people know.",
  },
  {
    q: "Can I swim with them?",
    a: "No. They are IP65: dust, sweat, and splashes. They are not for swimming or showering.",
  },
  {
    q: "How long does the battery last?",
    a: "The 290mAh battery lasts up to 96 hours on standby, about 11 hours of music, and about 60 minutes of continuous video. A USB-C charge takes about 80 minutes, or about 50 minutes on fast charge.",
  },
] as const;

export const budsImageSize = { width: 1600, height: 1600 } as const;
export const budsBannerSize = { width: 1920, height: 900 } as const;

export const budsFeatures = [
  {
    title: "Bluetooth 6.0",
    detail: "Quick pairing and a stable connection.",
  },
  {
    title: "10–15 m range",
    detail: "Move around the room while your music keeps playing.",
  },
  {
    title: "Up to 5 hours per charge",
    detail: "Listening time is 3–5 hours per charge. Top up in the charging case between sessions.",
  },
  {
    title: "Pocket-size charging case",
    detail: "Charges by USB-C.",
  },
  {
    title: "300+ hours standby",
    detail: "Standby is 300–400 hours.",
  },
  {
    title: "Calls and controls",
    detail: "Built-in microphone for calls, and touch controls on each bud.",
  },
] as const;

export const budsFacts = [
  { label: "Availability", value: "Available now. Ships from US warehouses in 7 to 10 days." },
  { label: "Price", value: budsPriceLabel },
  { label: "Colors", value: "Black and White." },
  { label: "Bluetooth", value: "6.0" },
  { label: "Range", value: "10–15 m" },
  { label: "Playtime", value: "3–5 hours per charge." },
  { label: "With the case", value: "Up to 15 hours. The case holds about 3 extra charges." },
  { label: "Standby", value: "300–400 hours" },
  { label: "Earbud battery", value: "30mAh each" },
  { label: "Case battery", value: "150mAh" },
  { label: "Charging", value: "USB-C. Earbuds charge in about 1.5 hours." },
  { label: "Microphone", value: "Built-in microphone for calls." },
  { label: "Controls", value: "Touch controls." },
  { label: "Water", value: "IPX4. Sweat and light rain. Not for swimming." },
  { label: "Weight", value: "About 4 g each. Case about 32 g." },
  { label: "In the box", value: "Joova Buds, charging case, USB-C cable, ear tips (S/M/L), quick start guide." },
  { label: "Warranty", value: "1 year after you register the product in your Joova Customer Account." },
  { label: "Returns", value: "30-day returns." },
  { label: "App", value: "No app needed. Pair in your phone's Bluetooth settings." },
] as const;

export const watchImageSize = { width: 1600, height: 1600 } as const;
export const watchBannerSize = { width: 1920, height: 900 } as const;
export const watchLineupSize = { width: 2400, height: 1600 } as const;

export const watchVariants = [
  {
    id: "black",
    name: "Black",
    image: "/watches/joova-watch-black-1600.png",
    alt: "Joova Watch in black, silver case and dark silicone strap, on a white background",
  },
  {
    id: "orange",
    name: "Orange",
    image: "/watches/joova-watch-orange-1600.png",
    alt: "Joova Watch in orange, silver case and orange silicone strap, on a white background",
  },
] as const;

export const watchFeatures = [
  {
    title: "No subscription. Ever.",
    detail: "Every feature in the Joova app is included with the watch.",
  },
  {
    title: "1.81\" color touch screen",
    detail: "A bright 240 × 284 display with swappable watch faces.",
  },
  {
    title: "Bluetooth calls",
    detail: "Answer and make calls from your wrist with the built-in mic and speaker.",
  },
  {
    title: "Notifications",
    detail: "See texts and app alerts on your wrist. Some alerts work differently on iPhone.",
  },
  {
    title: "Heart rate and sleep",
    detail: "Heart rate, sleep, and steps for general wellness. Not a medical device.",
  },
  {
    title: "Sports modes",
    detail: "Walking, running, cycling, and more.",
  },
] as const;

export const watchFacts = [
  { label: "Availability", value: "Available now. Ships from US warehouses in 7 to 10 days." },
  { label: "Price", value: watchPriceLabel },
  { label: "Colors", value: "Black or Orange. Silver case, silicone strap." },
  { label: "Screen", value: "1.81\" color touch screen, 240 × 284." },
  { label: "Case", value: "Metal alloy." },
  { label: "Calls", value: "Bluetooth calling with a built-in microphone and speaker." },
  { label: "Tracking", value: "Heart rate, sleep, and steps. Wellness readings only." },
  { label: "Sports", value: "Walking, running, cycling, and more." },
  { label: "Battery", value: "280mAh. About 5 to 7 days of typical use. Battery life varies with settings and use." },
  { label: "Charging", value: "Magnetic cable. About 2 hours." },
  { label: "Water", value: "IP67. Splash and rain. Not for swimming or showering." },
  { label: "App", value: "Joova app. iPhone with iOS 13 or later, Android 8 or later." },
  { label: "In the box", value: "Joova Watch, magnetic charging cable, quick start guide." },
  { label: "Warranty", value: "1 year after you register the product in your Joova Customer Account." },
  { label: "Returns", value: "30-day free returns." },
  { label: "Subscription", value: noSubscription },
] as const;

export const watchFaqs = [
  {
    q: "Is there a monthly fee?",
    a: "No. Every feature in the Joova app is included with the watch.",
  },
  {
    q: "Can I take calls on it?",
    a: "Yes. Pair it with your phone over Bluetooth and answer or make calls from your wrist.",
  },
  {
    q: "Does it work with iPhone?",
    a: "Yes, iPhone and Android with the free Joova app. iPhone needs iOS 13 or later. Android needs 8 or later. Some notification features work differently on iPhone.",
  },
  {
    q: "Can I swim with it?",
    a: "No. It is splash and rain resistant (IP67). Take it off before swimming or showering.",
  },
  {
    q: "Does it measure blood pressure?",
    a: "No. Joova Watch does not show blood pressure. It is for general wellness, not a medical device.",
  },
] as const;

export const budsFaqs = [
  {
    q: "Do they work with iPhone and Android?",
    a: "Yes, with any phone, tablet, or laptop that has Bluetooth.",
  },
  {
    q: "Do I need an app?",
    a: "No. Pair them in your phone's Bluetooth settings.",
  },
  {
    q: "How long does the battery last?",
    a: "3–5 hours of listening per charge, up to 5 hours in lighter use. The case adds about 3 charges, for up to 15 hours in total.",
  },
  {
    q: "Can I take calls?",
    a: "Yes. Each bud has a microphone, and you answer or end a call with the touch controls.",
  },
  {
    q: "Can I swim with them?",
    a: "No. They are IPX4: sweat and light rain. They are not for swimming or showering.",
  },
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
    image: "/bands/joova-band-black-1600.png",
    box: "/boxes/box-black.png",
    price: PRICE,
    status: "Available" as const,
  },
  {
    id: "blue",
    name: "Blue",
    strap: "Blue woven",
    pod: "Black",
    strapHex: "#2F6BC8",
    boxHex: "#6C98DD",
    image: "/bands/joova-band-blue-1600.png",
    box: "/boxes/box-blue.png",
    price: PRICE,
    status: "Available" as const,
  },
  {
    id: "green",
    name: "Green",
    strap: "Green woven",
    pod: "Black",
    strapHex: "#2F8A5A",
    boxHex: "#8CC2A2",
    image: "/bands/joova-band-green-1600.png",
    box: "/boxes/box-green.png",
    price: PRICE,
    status: "Available" as const,
  },
  {
    id: "orange",
    name: "Orange",
    strap: "Orange woven",
    pod: "Black",
    strapHex: "#FF8424",
    boxHex: "#F8A765",
    image: "/bands/joova-band-orange-1600.png",
    box: "/boxes/box-orange.png",
    price: PRICE,
    status: "Available" as const,
  },
  {
    id: "red",
    name: "Red",
    strap: "Red woven",
    pod: "Black",
    strapHex: "#D8302E",
    boxHex: "#EF7C75",
    image: "/bands/joova-band-red-1600.png",
    box: "/boxes/box-red.png",
    price: PRICE,
    status: "Available" as const,
  },
] as const;

export type BandVariant = (typeof bandVariants)[number];

export function includedExtra(worn: BandVariant) {
  const extraId = worn.id === "black" ? "blue" : "black";
  return bandVariants.find((variant) => variant.id === extraId) ?? bandVariants[0];
}

export const ringImageSize = { width: 1600, height: 1600 } as const;
export const ringBannerSize = { width: 1920, height: 1080 } as const;
export const ringLineupSize = { width: 1500, height: 1125 } as const;
export const ringSizes = [7, 8, 9, 10, 11, 12] as const;

export const ringVariants = [
  {
    id: "silver-classic",
    finishId: "silver",
    styleId: "classic",
    name: "Silver",
    finish: "Silver",
    style: "Classic",
    hex: "#A9AFB6",
    image: "/rings/joova-ring-silver-classic-1600.png",
    summary: "Smooth silver stainless steel.",
  },
  {
    id: "silver-wave",
    finishId: "silver",
    styleId: "wave",
    name: "Silver",
    finish: "Silver",
    style: "Wave",
    hex: "#A9AFB6",
    image: "/rings/joova-ring-silver-wave-1600.png",
    summary: "Silver stainless steel with a textured diagonal pattern.",
  },
  {
    id: "black-classic",
    finishId: "black",
    styleId: "classic",
    name: "Black",
    finish: "Black",
    style: "Classic",
    hex: "#26282C",
    image: "/rings/joova-ring-black-classic-1600.png",
    summary: "Smooth black stainless steel.",
  },
  {
    id: "black-wave",
    finishId: "black",
    styleId: "wave",
    name: "Black",
    finish: "Black",
    style: "Wave",
    hex: "#26282C",
    image: "/rings/joova-ring-black-wave-1600.png",
    summary: "Black stainless steel with a textured diagonal pattern.",
  },
  {
    id: "rose-gold-classic",
    finishId: "rose-gold",
    styleId: "classic",
    name: "Rose Gold",
    finish: "Rose Gold",
    style: "Classic",
    hex: "#C98B6C",
    image: "/rings/joova-ring-rose-gold-classic-1600.png",
    summary: "Smooth rose gold stainless steel.",
  },
  {
    id: "rose-gold-wave",
    finishId: "rose-gold",
    styleId: "wave",
    name: "Rose Gold",
    finish: "Rose Gold",
    style: "Wave",
    hex: "#C98B6C",
    image: "/rings/joova-ring-rose-gold-wave-1600.png",
    summary: "Rose gold stainless steel with a textured diagonal pattern.",
  },
] as const;

export type RingVariant = (typeof ringVariants)[number];

export const ringFeatures = [
  {
    title: "No subscription. Ever.",
    detail: "Every feature in the Joova app is included with the ring.",
  },
  {
    title: "Sleep tracking",
    detail: "See how long and how well you sleep. Wellness readings only.",
  },
  {
    title: "Heart rate and blood oxygen",
    detail: "Heart-rate tracking and blood-oxygen readings for general wellness.",
  },
  {
    title: "Activity",
    detail: "Steps and calories.",
  },
  {
    title: "About 3 days",
    detail: "Daily use per charge from a 19mAh battery. Standby is 7–10 days. Battery life varies with settings and use.",
  },
  {
    title: "Free updates",
    detail: "Over-the-air updates add improvements at no cost.",
  },
] as const;

export const ringFacts = [
  { label: "Price", value: ringPriceLabel },
  { label: "Material", value: "Stainless steel shell with an epoxy resin inner layer." },
  { label: "Finishes", value: "Silver, Black, and Rose Gold." },
  { label: "Styles", value: "Classic, smooth. Wave, textured diagonal pattern." },
  { label: "Sizes", value: "US 7 to 12. A free sizing kit is available." },
  { label: "Battery", value: "19mAh. About 3 days in daily use. 7–10 days standby." },
  { label: "Charging", value: "Charging dock and USB cable." },
  { label: "Water", value: "IP68 / 5ATM. Shower, pool, and dishes. Not for hot tubs, saunas, or diving." },
  { label: "Tracks", value: "Sleep, heart rate, blood oxygen, steps, and calories. Wellness only." },
  { label: "App", value: "Joova app. iPhone with iOS 15 or later, Android 9 or later. Syncs with Apple Health and Google Health Connect." },
  { label: "Updates", value: "Over the air, at no cost." },
  { label: "In the box", value: "Joova Ring, charging dock, USB cable, quick start guide." },
  { label: "Warranty", value: "2 years after you register the ring in your Joova Customer Account." },
  { label: "Returns", value: "30-day free returns in the US, including a free size exchange. This is the only free return window." },
  { label: "Subscription", value: noSubscription },
] as const;

export const ringFaqs = [
  {
    q: "Is there a monthly fee?",
    a: "No. Every feature in the Joova app is included with the ring, now and later.",
  },
  {
    q: "How do I find my size?",
    a: "Order the free sizing kit, wear the sample ring for a day, then confirm your size. Smart rings fit differently from jewelry, so a jewelry size is a rough start. If the ring does not fit, we exchange it for free.",
  },
  {
    q: "Which finger should I wear it on?",
    a: "The index finger gives the best readings. The middle or ring finger works well too.",
  },
  {
    q: "How long does the battery last?",
    a: "About 3 days in daily use, depending on settings and use. Standby is 7–10 days.",
  },
  {
    q: "Can I swim or shower with it?",
    a: "Yes. It is rated IP68 / 5ATM for the shower, the pool, and washing dishes. Take it off for hot tubs, saunas, and diving.",
  },
  {
    q: "Which phones work with it?",
    a: "iPhone with iOS 15 or later, and Android 9 or later, with the free Joova app. It syncs with Apple Health and Google Health Connect.",
  },
  {
    q: "Is it a medical device?",
    a: "No. Joova Ring is for general wellness and fitness. It does not diagnose, treat, or detect disease.",
  },
] as const;

export const straps = bandVariants.map((variant) => ({
  id: `strap-${variant.id}`,
  name: `${variant.name} woven strap`,
  material: "Woven",
  color: variant.name,
  hex: variant.strapHex,
  image: variant.image,
  collection: "Launch",
  price: STRAP_PRICE,
}));

export const boxBack = "/boxes/box-back.png";
export const unboxingImage = "/packaging/unboxing-and-inserts.png";

export const boxFacts = [
  { label: "Type", value: "Rigid two-piece box. Lid and base." },
  { label: "Size", value: "12 × 16 × 5 cm." },
  { label: "Finish", value: "Soft-touch matte. Gloss spot on the logo." },
  { label: "Colors", value: "One design, five colors. The box matches the band inside." },
  { label: "Front", value: "joova. wordmark, BAND, product photo, “No subscription. Ever.”" },
  { label: "Side", value: "Sleep · Heart · Activity" },
  { label: "Inside the lid", value: "Hello. No monthly bills here." },
];

export const inTheBox = [
  "Joova Band tracker and the strap you wear",
  "1 extra strap. Black includes blue. Every other color includes black.",
  "Magnetic charging cable",
  "Quick start guide",
];

export const bandFeatures = [
  {
    title: "No subscription. Ever.",
    detail: "Every feature in the Joova app is included with the band.",
  },
  {
    title: "Sleep tracking",
    detail: "See how long and how well you sleep.",
  },
  {
    title: "Heart rate",
    detail: "24/7 heart-rate and HRV trends. Wellness readings only.",
  },
  {
    title: "Blood oxygen",
    detail: "Blood-oxygen readings for general wellness, not a diagnosis.",
  },
  {
    title: "Activity",
    detail: "Steps, distance, and calories.",
  },
  {
    title: "Up to 20–30 days",
    detail: "Per charge, from a 55mAh battery. Standby is about 45 days. Battery life varies with settings and use.",
  },
] as const;

export const batteryFacts = [
  { label: "Battery", value: "55mAh" },
  { label: "Per charge", value: "Up to 20–30 days" },
  { label: "Standby", value: "About 45 days" },
  { label: "Charging", value: "About 2 hours, magnetic" },
] as const;

export const useSteps = [
  "Charge the band with the magnetic cable before the first wear. A full charge takes about 2 hours.",
  "Wear the woven loop and fasten the silver buckle so the tracker sits flat.",
  "Wear it for sleep, heart-rate trends, and daily activity. Open the Joova app when you want the details.",
  "Charge again when the app asks. Use lasts up to 20–30 days. Battery life varies with settings and use.",
] as const;

export const careNotes = [
  {
    title: "Handling",
    body: "Wipe the woven strap after sweat or a rinse. Keep the magnetic contacts clean and dry.",
  },
  {
    title: "Charging",
    body: "Connect the magnetic charging cable. A full charge takes about 2 hours. Charge the band only when it is dry.",
  },
  {
    title: "Water",
    body: "1ATM. Splash and rain resistant. Take it off before swimming or showering. Dry it completely before charging.",
  },
] as const;

export const specs = [
  { label: "Price", value: `${priceLabel}. Available now. ${noSubscription}` },
  { label: "Tracker", value: "Plastic case. No screen." },
  { label: "Strap", value: "Nylon woven loop, adjustable. Fits wrists about 14–22 cm (5.5–8.7 in)." },
  { label: "Colors", value: "Black, Blue, Green, Orange, and Red." },
  { label: "In the box", value: "Tracker and worn strap, 1 extra strap, magnetic charging cable, quick start guide." },
  { label: "Extra strap", value: "Black includes a blue strap. Every other color includes a black strap." },
  { label: "Metrics", value: "Sleep, 24/7 heart rate, HRV trends, blood-oxygen readings, steps, distance, and calories. Wellness only." },
  { label: "Battery", value: "55mAh. Up to 20–30 days per charge. About 45 days standby. Battery life varies with settings and use." },
  { label: "Charging", value: "Magnetic cable. Full charge in about 2 hours." },
  { label: "Water", value: "1ATM. Splash and rain. Not for swimming or showering." },
  { label: "Phone", value: "Joova app. iPhone with iOS 15 or later, and Android 9 or later." },
  { label: "Health apps", value: "Works with Apple Health and Google Health Connect." },
  { label: "Strap warranty", value: "Lifetime against manufacturing defects, after the band is registered in your Joova Customer Account." },
  { label: "Tracker warranty", value: "2 years, plus a third year, after you register the band in your Joova Customer Account." },
  { label: "Shipping", value: "Ships from US warehouses. Delivered in 7 to 10 days. Free in the United States." },
  { label: "Returns", value: "30-day free returns. US return shipping is covered." },
];

export const faqs = [
  {
    q: "Does it need a subscription?",
    a: "No. The Fitness Band and the Smart Ring do not need a subscription. Ever. Every feature in the Joova app is included with the product you buy. We will never charge a monthly fee for features that come with the band or the ring.",
  },
  {
    q: "Which phones does it work with?",
    a: "iPhone with iOS 15 or later, and Android phones on Android 9 or later. The Joova app is on iOS and Android.",
  },
  {
    q: "How long does the battery last?",
    a: "The 55mAh battery lasts up to 20–30 days per charge, depending on settings and use. Standby is about 45 days. A full charge takes about 2 hours.",
  },
  {
    q: "How do I charge it?",
    a: "With the magnetic charging cable. A full charge takes about 2 hours. Dry the band before you charge it.",
  },
  {
    q: "Can I swim or shower with it?",
    a: "No. It is splash and rain resistant (1ATM). Take it off before swimming or showering, and dry it before charging.",
  },
  {
    q: "What comes in the box?",
    a: `The tracker and the strap you wear, 1 extra strap, a magnetic charging cable, and a quick start guide. A black band includes a blue extra strap. Every other color includes a black extra strap. More colors are ${strapPriceLabel} each.`,
  },
  {
    q: "When does it ship?",
    a: "Every Joova product is available now. Orders ship from US warehouses, and delivery takes 7 to 10 days. Free shipping in the United States.",
  },
  {
    q: "What is the return policy?",
    a: "30 days from delivery, and only in the United States. We cover return shipping. After 30 days, the free return window is closed. Start the return from your Joova Customer Account, or from the Returns page.",
  },
  {
    q: "What is covered by warranty?",
    a: "Warranty starts when you register the product. Sign up for a Joova Customer Account, then register the band. Straps: lifetime against manufacturing defects. Tracker: 2 years, plus a third year, after registration.",
  },
  {
    q: "Is it a medical device?",
    a: "No. Joova Band is for general wellness and fitness. It does not diagnose, treat, or detect disease.",
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
  { title: "Lifetime strap warranty", href: "/warranty", copy: "Manufacturing defects on the woven straps, for life, after you register the band." },
  { title: "Tracker warranty", href: "/warranty", copy: "2 years on the tracker, plus a third year, after you register it in your Joova Customer Account." },
  { title: "Replacement ships first", href: "/warranty", copy: "We send the replacement, then you send the old one." },
  { title: "US-based support", href: "/contact", copy: "Real people. Every message gets a reply within 6 to 24 hours." },
  { title: "Secure checkout", href: "/band", copy: "American Express, Visa, Mastercard, Apple Pay, Google Pay, Shop Pay, PayPal, Bancontact, and Wero." },
];

export const helpArticles = [
  {
    slug: "setup",
    title: "Set up your Joova Band",
    summary: "Unbox, charge, pair, and put on your first strap.",
    body: "Charge the band with the magnetic cable before the first wear. A full charge takes about 2 hours.\n\nOpen the Joova app and follow the pairing steps. Fasten the silver buckle so the tracker sits flat.\n\nUse lasts up to 20–30 days per charge. Battery life varies with settings and use.",
  },
  {
    slug: "charging",
    title: "Charging",
    summary: "Magnetic charging in about 2 hours.",
    body: "Joova Band charges with the magnetic cable in the box. A full charge takes about 2 hours.\n\nThe battery is 55mAh. Dry the band first. Do not charge it while it is wet, and keep the contacts clean.",
  },
  {
    slug: "battery",
    title: "Battery life",
    summary: "55mAh. Up to 20–30 days per charge.",
    body: "Joova Band has a 55mAh battery.\n\nUse lasts up to 20–30 days per charge, depending on settings and use. Standby is about 45 days.\n\nCharge it with the magnetic cable. A full charge takes about 2 hours.",
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
    body: "The band is 1ATM: splash and rain resistant. It is not for swimming or showering.\n\nDry the band completely before charging. Do not charge it while it is wet. Wipe the strap and the magnetic contacts after rain or a splash.",
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
    body: "Turn Bluetooth on, open the Joova app, and keep the band near your phone. It pairs in the app and syncs in the background whenever the phone is nearby.",
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
