import type { ProductCoverage } from "@/lib/catalog/coverage";
import {
  BUDS_PRICE,
  GLASSES_PRICE,
  budsImageSize,
  budsPriceLabel,
  WATCH_PRICE,
  watchImageSize,
  watchPriceLabel,
  watchVariants,
  PRICE,
  RING_PRICE,
  SHARE_PRICE,
  glassesImageSize,
  glassesPriceLabel,
  bandImageSize,
  bandVariants,
  noSubscription,
  policies,
  priceLabel,
  ringImageSize,
  ringPriceLabel,
  ringVariants,
  shareImageSize,
  sharePriceLabel,
} from "@/content/site";

export type CatalogImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type CatalogVideo = {
  src: string;
  title: string;
  poster: string;
};

export type CatalogVariant = {
  id: string;
  axis?: "color" | "type" | "size" | "custom";
  name: string;
  available?: boolean;
  pictures: CatalogImage[];
  videos: CatalogVideo[];
  color?: string;
  type?: string;
  size?: string;
  custom?: string;
  sku?: string;
  labels?: Partial<Record<"color" | "type" | "size" | "custom", string>>;
};

export type CatalogCategoryId = "wearables" | "devices" | "electronics" | "accessories";

export type CatalogProduct = {
  id: string;
  name: string;
  menuLabel: string;
  href: string;
  category: CatalogCategoryId;
  alsoIn?: readonly CatalogCategoryId[];
  price: number;
  priceLabel: string;
  status: string;
  summary: string;
  image: CatalogImage;
  pictures: CatalogImage[];
  sharedPictures?: CatalogImage[];
  videos?: CatalogVideo[];
  variants?: CatalogVariant[];
  defaultVariantId?: string;
  kicker: string;
  lead: string;
  detail: string;
  note: string;
  signals: readonly { label: string; text: string }[];
  topPick?: boolean;
  compareAt?: number;
  compareAtLabel?: string;
  unpriced?: boolean;
  sku?: string;
  model?: string;
  availability?: "in_stock" | "out_of_stock";
  availableCount?: number;
  colors?: { name: string; image?: string }[];
  warrantyNote?: string;
  coverage?: ProductCoverage;
};

export const catalogCategories = [
  {
    id: "wearables",
    label: "Wearables",
    href: "/shop#wearables",
    summary: "Bands, rings, watches, and glasses you wear.",
  },
  {
    id: "devices",
    label: "Smart devices",
    href: "/shop#devices",
    summary: "The Fitness Band, Smart Ring, Joova Watch, and AI camera glasses.",
  },
  {
    id: "electronics",
    label: "Electronics",
    href: "/shop#electronics",
    summary: "Earbuds and audio.",
  },
  {
    id: "accessories",
    label: "Accessories",
    href: "/shop#accessories",
    summary: "Straps and add-ons.",
  },
] as const;

const bandPictures: CatalogImage[] = bandVariants.map((variant) => ({
  src: variant.image,
  alt: `Joova Band in ${variant.name}, woven strap with a black tracker and silver buckle`,
  width: bandImageSize.width,
  height: bandImageSize.height,
}));

const watchPictures: CatalogImage[] = watchVariants.map((watch) => ({
  src: watch.image,
  alt: watch.alt,
  width: watchImageSize.width,
  height: watchImageSize.height,
}));

const ringPictures: CatalogImage[] = ringVariants.map((ring) => ({
  src: ring.image,
  alt: `Joova Ring in ${ring.finish} ${ring.style}`,
  width: ringImageSize.width,
  height: ringImageSize.height,
}));

export const catalog: readonly CatalogProduct[] = [
  {
    id: "band",
    name: "Joova Band",
    menuLabel: "Fitness Band",
    href: "/band",
    category: "wearables",
    alsoIn: ["devices"],
    price: PRICE,
    priceLabel,
    status: "Available",
    summary:
      "Screenless tracker for sleep, heart rate, and activity. Up to 20–30 days per charge. No subscription needed. Ever.",
    image: bandPictures[0],
    pictures: bandPictures,
    kicker: "",
    lead: "Track everything. Pay once.",
    detail:
      `A screenless band for sleep, heart rate, and activity. Five colors. The box includes 1 strap in the color you choose. ${noSubscription}`,
    note: policies.heroLine,
    signals: [
      { label: "Sleep", text: "How long and how well" },
      { label: "Heart", text: "Rate and HRV trends" },
      { label: "Battery", text: "Up to 20–30 days" },
    ],
  },
  {
    id: "ring",
    name: "Smart Ring",
    menuLabel: "Smart Ring",
    href: "/ring",
    category: "wearables",
    alsoIn: ["devices"],
    price: RING_PRICE,
    priceLabel: ringPriceLabel,
    status: "Available",
    summary:
      "Stainless steel smart ring in Silver, Black, and Rose Gold, Classic or Wave. No subscription needed. Ever.",
    image: ringPictures[0],
    pictures: ringPictures,
    kicker: "Smart Ring",
    lead: "Smart ring. No subscription.",
    detail:
      `Silver, Black, and Rose Gold. Classic or Wave. Sleep, heart rate, and activity. ${noSubscription}`,
    note: "",
    signals: [
      { label: "Sleep", text: "Overnight trends" },
      { label: "Activity", text: "Through the day" },
      { label: "App", text: "No subscription needed" },
    ],
  },
  {
    id: "share",
    name: "Joova Share Pod",
    menuLabel: "Joova Share Pod",
    href: "/share",
    category: "electronics",
    price: SHARE_PRICE,
    priceLabel: sharePriceLabel,
    status: "Available",
    summary:
      "Four pairs of wireless buds in one case. Available now.",
    image: {
      src: "/electronics/joova-share.jpg",
      alt: "Joova Share Pod case with four bud styles, and two people sharing audio from one tablet",
      width: shareImageSize.width,
      height: shareImageSize.height,
    },
    pictures: [
      {
        src: "/electronics/joova-share.jpg",
        alt: "Joova Share Pod case with four bud styles, and two people sharing audio from one tablet",
        width: shareImageSize.width,
        height: shareImageSize.height,
      },
    ],
    kicker: "Electronics",
    lead: "Four pairs in one case.",
    detail:
      "Sport Clips, Pro In-Ear, Comfort Pods, and Mini Sleep Buds. All eight buds can link to one phone, tablet, or laptop, or pairs can run on separate devices.",
    note: "",
    signals: [
      { label: "Pairs", text: "Four styles" },
      { label: "Sharing", text: "One device or many" },
      { label: "Case", text: "LED battery display" },
    ],
  },
  {
    id: "watch",
    name: "Joova Watch",
    menuLabel: "Joova Watch",
    href: "/watch",
    category: "devices",
    alsoIn: ["wearables"],
    price: WATCH_PRICE,
    priceLabel: watchPriceLabel,
    status: "Available",
    summary:
      "1.81\" color smart watch with Bluetooth calls, heart rate, and sleep tracking. Black or Orange. No subscription needed. Ever.",
    image: watchPictures[0],
    pictures: watchPictures,
    kicker: "Smart watch",
    lead: "Calls on your wrist. No subscription.",
    detail:
      "A big-screen watch for calls, notifications, heart rate, sleep, and workouts. Black or Orange. No subscription needed. Ever.",
    note: "",
    signals: [
      { label: "Calls", text: "From your wrist" },
      { label: "Screen", text: "1.81\" color" },
      { label: "App", text: "No subscription needed" },
    ],
  },
  {
    id: "glasses",
    name: "Joova Glasses",
    menuLabel: "Joova Glasses",
    href: "/glasses",
    category: "devices",
    alsoIn: ["wearables"],
    price: GLASSES_PRICE,
    priceLabel: glassesPriceLabel,
    status: "Available",
    summary:
      "AI camera glasses for hands-free photos, live translation, and questions about what you see. Available now. No subscription needed. Ever.",
    image: {
      src: "/glasses/joova-glasses-front-angle-white-1600.png",
      alt: "Joova Glasses in matte black, front three-quarter view on a white background",
      width: glassesImageSize.width,
      height: glassesImageSize.height,
    },
    pictures: [
      {
        src: "/glasses/joova-glasses-front-angle-white-1600.png",
        alt: "Joova Glasses in matte black, front three-quarter view on a white background",
        width: glassesImageSize.width,
        height: glassesImageSize.height,
      },
    ],
    kicker: "AI camera glasses",
    lead: "See it. Snap it. Ask it.",
    detail:
      "Hands-free photos and video, live translation, and an AI assistant in everyday glasses. Available now. No subscription needed. Ever.",
    note: "",
    signals: [
      { label: "Camera", text: "8MP, hands free" },
      { label: "Translation", text: "Live conversations" },
      { label: "App", text: "No subscription needed" },
    ],
  },
  {
    id: "buds",
    name: "Joova Buds",
    menuLabel: "Joova Buds",
    href: "/buds",
    category: "electronics",
    price: BUDS_PRICE,
    priceLabel: budsPriceLabel,
    status: "Available",
    summary:
      "Bluetooth 6.0 earbuds with a pocket USB-C charging case. Available now. Separate from Joova Share Pod.",
    image: {
      src: "/buds/joova-buds-black-white-1600.png",
      alt: "Joova Buds in black with a white charging case on a white background",
      width: budsImageSize.width,
      height: budsImageSize.height,
    },
    pictures: [
      {
        src: "/buds/joova-buds-black-white-1600.png",
        alt: "Joova Buds in black with a white charging case on a white background",
        width: budsImageSize.width,
        height: budsImageSize.height,
      },
    ],
    kicker: "Electronics",
    lead: "Press play. Take it anywhere.",
    detail:
      "Bluetooth 6.0 earbuds that pair fast, with a pocket-size USB-C charging case. Available now.",
    note: "",
    signals: [
      { label: "Bluetooth", text: "Version 6.0" },
      { label: "Playtime", text: "Up to 5 hours" },
      { label: "Case", text: "USB-C" },
    ],
  },
];

/**
 * Homepage highlight order. The first id is the lead product.
 * Reorder or swap these ids when the featured product changes.
 */
export const featuredProductIds = ["band", "ring"] as const;

export function productById(id: string) {
  return catalog.find((product) => product.id === id);
}

export function productsInCategory(category: CatalogCategoryId) {
  return catalog.filter(
    (product) => product.category === category || product.alsoIn?.includes(category),
  );
}

export function categoryMenu(category: CatalogCategoryId) {
  return productsInCategory(category).map((product) => ({
    href: product.href,
    label: product.menuLabel,
  }));
}

export const featuredProducts = featuredProductIds.flatMap((id) => {
  const product = productById(id);
  return product ? [product] : [];
});

export type Deal = {
  id: string;
  title: string;
  badge: string;
  detail: string;
  href: string;
  priceLabel: string | null;
  compareAtLabel: string | null;
  image: { src: string; alt: string; width: number; height: number } | null;
};

export const deals: readonly Deal[] = [];
