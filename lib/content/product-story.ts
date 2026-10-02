import type { CatalogProduct } from "@/content/catalog";

export type SpecRow = { label: string; value: string };

export type ProductStory = {
  kicker: string;
  lead: string;
  summary: string;
  overview: string;
  note: string;
  signals: { label: string; text: string }[];
  specifications: SpecRow[];
  inTheBox: string[];
  compatibility: string;
  care: string;
  app: string;
};

export type SavedDetails = {
  specifications?: SpecRow[];
  inTheBox?: string;
  compatibility?: string;
  care?: string;
  app?: string;
};

const wellness = "Readings are for general wellness. They are not a substitute for professional medical equipment.";

const band: ProductStory = {
  kicker: "",
  lead: "Track everything. Pay once.",
  summary: "Screenless tracker for sleep, heart rate, and activity. Up to 20–30 days per charge. No subscription needed. Ever.",
  overview: "A screenless Joova Fitness Band for sleep, heart rate, and daily activity. Five colors. The box includes 1 woven strap in the color you choose. There is no display on the band. Open the Joova app when you want the details. No subscription needed. Ever.",
  note: wellness,
  signals: [
    { label: "Sleep", text: "How long and how well" },
    { label: "Heart", text: "Rate and HRV trends" },
    { label: "Battery", text: "Up to 20–30 days" },
  ],
  specifications: [
    { label: "Tracker", value: "Plastic case. No screen." },
    { label: "Strap", value: "Nylon woven loop, adjustable. Fits wrists about 14–22 cm (5.5–8.7 in)." },
    { label: "Colors", value: "Black, Blue, Green, Orange, and Red." },
    { label: "Battery", value: "55mAh. Up to 20–30 days per charge. About 45 days standby." },
    { label: "Charging", value: "Magnetic cable. A full charge takes about 2 hours." },
    { label: "Water", value: "1 ATM. Splash and rain. Not for swimming or showering." },
    { label: "Readings", value: "Sleep, heart rate, HRV, blood oxygen, steps, distance, and calories." },
  ],
  inTheBox: ["Joova Fitness Band tracker", "1 woven strap in the color you choose", "Magnetic charging cable", "Quick start guide"],
  compatibility: "Joova app on iPhone with iOS 15 or later, and Android 9 or later. Works with Apple Health and Google Health Connect.",
  care: "Wipe the woven strap after sweat or a rinse. Keep the magnetic contacts clean and dry. Charge the band only when it is dry. Take it off before swimming or showering.",
  app: "Every feature in the Joova app is included with the band. No subscription. Ever.",
};

const bandPlus: ProductStory = {
  kicker: "",
  lead: "Screenless. Pay once.",
  summary: "Screenless band for heart rate, ECG, blood pressure, sleep, and activity. Silver, black, or gold. Readings are not a substitute for professional medical equipment. No subscription needed. Ever.",
  overview: "A screenless Joova Band ECG J02 with an aluminum alloy case and a PC back. Silver, black, or gold. The box includes the band, 1 extra woven strap, a magnetic charging cable, and a quick-start guide. It can be worn on the wrist or the ankle. Sport modes expand in the Joova app. Charge the band before the first use. No subscription needed. Ever.",
  note: wellness,
  signals: [
    { label: "Heart", text: "Rate, ECG, and blood pressure" },
    { label: "Sleep", text: "Up to 24 hours" },
    { label: "Battery", text: "180 mAh, about 15–20 days" },
  ],
  specifications: [
    { label: "Model", value: "Joova Band ECG J02" },
    { label: "Case", value: "Aluminum alloy with a PC back. No screen." },
    { label: "Colors", value: "Silver, black, or gold." },
    { label: "Size", value: "45.6 × 26.6 × 9.9 mm." },
    { label: "Strap", value: "22 mm woven strap. It can be replaced." },
    { label: "Bluetooth", value: "5.3" },
    { label: "Battery", value: "180 mAh. About 15–20 days of use. Standby up to 20–30 days." },
    { label: "Charging", value: "Magnetic. About 2.5 hours." },
    { label: "Water", value: "1 ATM splash resistant. Not for swimming or showering." },
    { label: "Wear", value: "Wrist or ankle." },
    { label: "In the app", value: "Heart rate, blood oxygen, ECG, blood pressure, sleep for up to 24 hours, steps, distance, calories, and stress." },
    { label: "Reminders", value: "Call and message reminders, alarm, sedentary and other daily reminders, fall detection, and SOS." },
  ],
  inTheBox: ["Joova Band ECG J02", "1 extra woven strap", "Magnetic charging cable", "Quick-start guide"],
  compatibility: "Joova app on iPhone and Android. Set emergency contacts in the app, then press the button several times to start an SOS call.",
  care: "Charge the band before the first use, and only when it is dry. It is splash resistant at 1 ATM. It is not for swimming or showering. Wipe the woven strap and keep the magnetic contacts clean.",
  app: "The Joova app includes the readings, reminders, sport modes, and SOS setup. No subscription needed. Ever.",
};

const buds: ProductStory = {
  kicker: "Electronics",
  lead: "Press play. Take it anywhere.",
  summary: "Bluetooth 6.0 earbuds with a pocket USB-C charging case. Available now. Separate from Joova Share Pod.",
  overview: "Joova Buds pair from your phone’s Bluetooth settings. Listening time is 3–5 hours per charge, and the pocket case holds about 3 extra charges. They are separate from Joova Share Pod.",
  note: "",
  signals: [
    { label: "Bluetooth", text: "Version 6.0" },
    { label: "Playtime", text: "Up to 5 hours" },
    { label: "Case", text: "USB-C" },
  ],
  specifications: [
    { label: "Bluetooth", value: "6.0. Range about 10–15 m." },
    { label: "Colors", value: "Black and White." },
    { label: "Playtime", value: "3–5 hours per charge. Up to 15 hours with the case." },
    { label: "Standby", value: "300–400 hours." },
    { label: "Earbud battery", value: "30mAh each." },
    { label: "Case battery", value: "150mAh. About 3 extra charges." },
    { label: "Charging", value: "USB-C. Earbuds charge in about 1.5 hours." },
    { label: "Controls", value: "Touch controls and a built-in microphone for calls." },
    { label: "Water", value: "IPX4. Sweat and light rain. Not for swimming." },
    { label: "Weight", value: "About 4 g each. Case about 32 g." },
  ],
  inTheBox: ["Joova Buds", "Charging case", "USB-C cable", "Ear tips (S, M, and L)", "Quick start guide"],
  compatibility: "Pair in your phone’s Bluetooth settings. No Joova app is required.",
  care: "IPX4 covers sweat and light rain. They are not for swimming. Dry the buds before they go back in the case. Wipe the ear tips and replace them when they wear out.",
  app: "No app needed. Pair in your phone’s Bluetooth settings.",
};

const strap: ProductStory = {
  kicker: "",
  lead: "A woven strap. No tracker.",
  summary: "A woven strap without the tracker. Five colors.",
  overview: "A nylon woven loop for the Joova Fitness Band, sold without the tracker. Five colors. It uses the same buckle as the strap that comes with the band.",
  note: "",
  signals: [
    { label: "Strap", text: "Woven nylon" },
    { label: "Tracker", text: "Not included" },
    { label: "Colors", text: "Five choices" },
  ],
  specifications: [
    { label: "Fits", value: "Joova Fitness Band. Wrists about 14–22 cm (5.5–8.7 in)." },
    { label: "Material", value: "Nylon woven loop with a buckle." },
    { label: "Colors", value: "Black, Blue, Green, Orange, and Red." },
    { label: "Tracker", value: "Not included." },
  ],
  inTheBox: ["1 woven strap"],
  compatibility: "Made for the Joova Fitness Band. It does not fit the Joova Fitness Band Plus.",
  care: "Wipe the strap after sweat or a rinse. Let it dry before you wear it again.",
  app: "",
};

const strapPack: ProductStory = {
  ...strap,
  lead: "Two woven straps. No tracker.",
  summary: "Two woven straps without the tracker. Each pack is two different colors.",
  overview: "Two nylon woven straps for the Joova Fitness Band, sold without the tracker. Each pack is two different colors.",
  signals: [
    { label: "Pack", text: "Two straps" },
    { label: "Colors", text: "Two different colors" },
    { label: "Tracker", text: "Not included" },
  ],
  inTheBox: ["2 woven straps, each a different color"],
};

const plusStrap: ProductStory = {
  kicker: "",
  lead: "A 22 mm strap for the Band Plus.",
  summary: "A 22 mm woven strap for the Joova Band ECG J02, without the tracker. Silver, black, or gold.",
  overview: "A 22 mm woven strap for the Joova Fitness Band Plus. The tracker is not included. Silver, black, or gold.",
  note: "",
  signals: [
    { label: "Width", text: "22 mm" },
    { label: "Fits", text: "Band Plus" },
    { label: "Tracker", text: "Not included" },
  ],
  specifications: [
    { label: "Fits", value: "Joova Fitness Band Plus (ECG J02)." },
    { label: "Width", value: "22 mm." },
    { label: "Colors", value: "Silver, black, or gold." },
    { label: "Tracker", value: "Not included." },
  ],
  inTheBox: ["1 woven strap, 22 mm"],
  compatibility: "Made for the Joova Fitness Band Plus. It is not the strap for the original Joova Fitness Band.",
  care: "Wipe the strap after sweat or a rinse. Let it dry before you wear it again.",
  app: "",
};

const plusStrapPack: ProductStory = {
  ...plusStrap,
  lead: "Two 22 mm straps. No tracker.",
  summary: "Two 22 mm woven straps for the Joova Band ECG J02, without the tracker. Each pack is two different colors.",
  overview: "Two 22 mm woven straps for the Joova Fitness Band Plus, sold without the tracker. Each pack is two different colors.",
  signals: [
    { label: "Pack", text: "Two straps" },
    { label: "Width", text: "22 mm" },
    { label: "Tracker", text: "Not included" },
  ],
  inTheBox: ["2 woven straps, 22 mm, each a different color"],
};

function storyFor(name: string, model: string) {
  const text = `${name} ${model}`.toLowerCase();
  const plus = /plus|ecg|\bj02\b|jtfb02/.test(text);
  const pack = /2\s*pack|two pack|jtfbs03|jtfbs04/.test(text);
  if (/strap/.test(text)) {
    if (plus && pack) return plusStrapPack;
    if (plus) return plusStrap;
    if (pack) return strapPack;
    return strap;
  }
  if (/bud/.test(text)) return buds;
  if (plus && /band|tracker|j02/.test(text)) return bandPlus;
  if (/band|jtfb01/.test(text)) return band;
  return null;
}

function lines(value: string) {
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function savedDetails(value: unknown): SavedDetails {
  if (!value || typeof value !== "object") return {};
  const row = value as SavedDetails;
  const specifications = Array.isArray(row.specifications)
    ? row.specifications.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const label = String(item.label ?? "").trim();
        const spec = String(item.value ?? "").trim();
        return label && spec ? [{ label, value: spec }] : [];
      })
    : [];
  return {
    specifications,
    inTheBox: typeof row.inTheBox === "string" ? row.inTheBox : "",
    compatibility: typeof row.compatibility === "string" ? row.compatibility : "",
    care: typeof row.care === "string" ? row.care : "",
    app: typeof row.app === "string" ? row.app : "",
  };
}

export function storySuggestions(name: string, model: string) {
  return storyFor(name, model);
}

export function padGlances(rows: { label?: string; text?: string }[]) {
  const next = rows.slice(0, 4).map((row) => ({ label: String(row.label ?? ""), text: String(row.text ?? "") }));
  while (next.length < 4) next.push({ label: "", text: "" });
  return next;
}

export function detailsFromCommerce(commerce: Record<string, unknown>) {
  return savedDetails(commerce.details);
}

export function applyStory(product: CatalogProduct, details: unknown): CatalogProduct {
  const story = storyFor(product.name, product.model ?? "");
  const saved = savedDetails(details);
  const signals = product.signals.length ? product.signals : story?.signals ?? [];
  const specifications = saved.specifications?.length ? saved.specifications : story?.specifications ?? [];
  const inTheBox = lines(saved.inTheBox ?? "");
  return {
    ...product,
    kicker: product.kicker || story?.kicker || "",
    lead: product.lead || story?.lead || "",
    detail: product.detail || story?.overview || "",
    note: product.note || story?.note || "",
    signals,
    story: {
      specifications,
      inTheBox: inTheBox.length ? inTheBox : story?.inTheBox ?? [],
      compatibility: (saved.compatibility ?? "").trim() || story?.compatibility || "",
      care: (saved.care ?? "").trim() || story?.care || "",
      app: (saved.app ?? "").trim() || story?.app || "",
    },
  };
}
