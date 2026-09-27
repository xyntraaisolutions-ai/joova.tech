import { formatUsd } from "@/lib/utils";

export type MarginInput = {
  bands: number;
  straps: number;
  bandCost: number;
  strapCost: number;
  price: number;
  unsold: number;
  amazonUnits: number;
  websiteUnits: number;
  tiktokUnits: number;
  freightPerBand: number;
  customsPerBand: number;
  tariffPct: number;
  amazonReferralPct: number;
  amazonCouponPct: number;
  fbaFee: number;
  amazonTransfer: number;
  payPct: number;
  payFixed: number;
  customerShip: number;
  tiktokFeePct: number;
  tiktokShip: number;
  adsAmazon: number;
  adsMeta: number;
  adsTiktok: number;
  adsYouTube: number;
  adsOther: number;
};

export const marginDefaults: MarginInput = {
  bands: 1000,
  straps: 1500,
  bandCost: 10,
  strapCost: 1,
  price: 49.99,
  unsold: 50,
  amazonUnits: 850,
  websiteUnits: 80,
  tiktokUnits: 20,
  freightPerBand: 4,
  customsPerBand: 1,
  tariffPct: 10,
  amazonReferralPct: 15,
  amazonCouponPct: 15,
  fbaFee: 4.75,
  amazonTransfer: 1.25,
  payPct: 2.9,
  payFixed: 0.3,
  customerShip: 7,
  tiktokFeePct: 6,
  tiktokShip: 7,
  adsAmazon: 4000,
  adsMeta: 2000,
  adsTiktok: 2000,
  adsYouTube: 1000,
  adsOther: 0,
};

export type MarginLine = {
  label: string;
  total: number;
  note?: string;
};

export type MarginResult = {
  goods: number;
  freight: number;
  customs: number;
  tariff: number;
  landed: number;
  landedPerBand: number;
  sold: number;
  amazonUnits: number;
  websiteUnits: number;
  tiktokUnits: number;
  unassigned: number;
  channelsCapped: boolean;
  amazonPrice: number;
  revenue: number;
  grossProfit: number;
  grossMargin: number | null;
  amazonReferral: number;
  fba: number;
  amazonTransfer: number;
  webPay: number;
  webShip: number;
  tiktokFee: number;
  tiktokShip: number;
  marketing: number;
  channelAndMarketing: number;
  contribution: number;
  contributionMargin: number | null;
  lines: MarginLine[];
};

function n(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function cents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function units(value: number) {
  return Math.max(0, Math.round(n(value)));
}

function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((sumWeights, weight) => sumWeights + weight, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (weight / sum) * total);
  const counts = exact.map((value) => Math.floor(value));
  let left = total - counts.reduce((sumCounts, count) => sumCounts + count, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - counts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const item of order) {
    if (left <= 0) break;
    counts[item.index] += 1;
    left -= 1;
  }
  return counts;
}

function assignChannels(
  capacity: number,
  amazon: number,
  website: number,
  tiktok: number,
) {
  const requested = amazon + website + tiktok;
  if (capacity <= 0 || requested <= 0) {
    return { amazon: 0, website: 0, tiktok: 0, capped: requested > capacity };
  }
  if (requested <= capacity) {
    return { amazon, website, tiktok, capped: false };
  }
  const [amazonUnits, websiteUnits, tiktokUnits] = allocate(capacity, [
    amazon,
    website,
    tiktok,
  ]);
  return { amazon: amazonUnits, website: websiteUnits, tiktok: tiktokUnits, capped: true };
}

function times(count: number, amount: number) {
  return `${count.toLocaleString("en-US")} × ${formatUsd(amount)}`;
}

export function planMargin(input: MarginInput): MarginResult {
  const bands = units(input.bands);
  const straps = units(input.straps);
  const bandCost = cents(n(input.bandCost));
  const strapCost = cents(n(input.strapCost));
  const price = cents(n(input.price));
  const unsold = Math.min(bands, units(input.unsold));
  const capacity = bands - unsold;
  const freightPerBand = cents(n(input.freightPerBand));
  const customsPerBand = cents(n(input.customsPerBand));
  const tariffPct = n(input.tariffPct);
  const couponPct = Math.min(100, n(input.amazonCouponPct));
  const referralPct = n(input.amazonReferralPct);
  const fbaEach = cents(n(input.fbaFee));
  const transferEach = cents(n(input.amazonTransfer));
  const payPct = n(input.payPct);
  const payFixed = cents(n(input.payFixed));
  const customerShip = cents(n(input.customerShip));
  const tiktokFeePct = n(input.tiktokFeePct);
  const tiktokShipEach = cents(n(input.tiktokShip));

  const channels = assignChannels(
    capacity,
    units(input.amazonUnits),
    units(input.websiteUnits),
    units(input.tiktokUnits),
  );
  const sold = channels.amazon + channels.website + channels.tiktok;
  const unassigned = capacity - sold;

  const goods = cents(bands * bandCost + straps * strapCost);
  const freight = cents(bands * freightPerBand);
  const customs = cents(bands * customsPerBand);
  const dutyBase = cents(goods + freight);
  const tariff = cents(dutyBase * (tariffPct / 100));
  const landed = cents(goods + freight + customs + tariff);
  const landedPerBand = bands > 0 ? cents(landed / bands) : 0;

  const amazonPrice = cents(price * (1 - couponPct / 100));
  const amazonRevenue = cents(channels.amazon * amazonPrice);
  const websiteRevenue = cents(channels.website * price);
  const tiktokRevenue = cents(channels.tiktok * price);
  const revenue = cents(amazonRevenue + websiteRevenue + tiktokRevenue);

  const grossProfit = cents(revenue - landed);
  const grossMargin = revenue > 0 ? grossProfit / revenue : null;

  const amazonReferral = cents(amazonRevenue * (referralPct / 100));
  const fba = cents(channels.amazon * fbaEach);
  const amazonTransfer = cents(channels.amazon * transferEach);
  const webPayEach = cents(cents(price * (payPct / 100)) + payFixed);
  const webPay = cents(channels.website * webPayEach);
  const webShip = cents(channels.website * customerShip);
  const tiktokFee = cents(tiktokRevenue * (tiktokFeePct / 100));
  const tiktokShip = cents(channels.tiktok * tiktokShipEach);
  const adsAmazon = cents(n(input.adsAmazon));
  const adsMeta = cents(n(input.adsMeta));
  const adsTiktok = cents(n(input.adsTiktok));
  const adsYouTube = cents(n(input.adsYouTube));
  const adsOther = cents(n(input.adsOther));
  const marketing = cents(adsAmazon + adsMeta + adsTiktok + adsYouTube + adsOther);

  const channelAndMarketing = cents(
    amazonReferral + fba + amazonTransfer + webPay + webShip + tiktokFee + tiktokShip + marketing,
  );
  const contribution = cents(grossProfit - channelAndMarketing);
  const contributionMargin = revenue > 0 ? contribution / revenue : null;

  const lines: MarginLine[] = [
    { label: "Band manufacturing", total: cents(bands * bandCost), note: times(bands, bandCost) },
    { label: "Additional straps", total: cents(straps * strapCost), note: times(straps, strapCost) },
    { label: "Freight to the Texas warehouse", total: freight, note: times(bands, freightPerBand) },
    { label: "Customs and brokerage", total: customs, note: times(bands, customsPerBand) },
    { label: "US tariff", total: tariff, note: `${tariffPct}% × ${formatUsd(dutyBase)}` },
    { label: "Landed cost", total: landed, note: "Manufacturing + straps + freight + customs + tariff" },
    {
      label: "Revenue",
      total: revenue,
      note: `${times(channels.amazon, amazonPrice)} + ${times(channels.website, price)} + ${times(channels.tiktok, price)}`,
    },
    { label: "Gross profit", total: grossProfit, note: `${formatUsd(revenue)} − ${formatUsd(landed)}` },
    { label: "Amazon referral fee", total: amazonReferral, note: `${referralPct}% × ${formatUsd(amazonRevenue)}` },
    { label: "Amazon fulfillment to the customer", total: fba, note: times(channels.amazon, fbaEach) },
    { label: "Texas warehouse to Amazon", total: amazonTransfer, note: times(channels.amazon, transferEach) },
    {
      label: "Website card processing",
      total: webPay,
      note: times(channels.website, webPayEach),
    },
    { label: "Shipping to the website customer", total: webShip, note: times(channels.website, customerShip) },
    { label: "TikTok Shop fee", total: tiktokFee, note: `${tiktokFeePct}% × ${formatUsd(tiktokRevenue)}` },
    { label: "Shipping to the TikTok customer", total: tiktokShip, note: times(channels.tiktok, tiktokShipEach) },
    { label: "Amazon ads", total: adsAmazon },
    { label: "Instagram and Facebook ads", total: adsMeta },
    { label: "TikTok ads", total: adsTiktok },
    { label: "YouTube ads", total: adsYouTube },
    { label: "Other marketing", total: adsOther },
    {
      label: "Net profit",
      total: contribution,
      note: `${formatUsd(grossProfit)} − ${formatUsd(channelAndMarketing)}`,
    },
  ];

  return {
    goods,
    freight,
    customs,
    tariff,
    landed,
    landedPerBand,
    sold,
    amazonUnits: channels.amazon,
    websiteUnits: channels.website,
    tiktokUnits: channels.tiktok,
    unassigned,
    channelsCapped: channels.capped,
    amazonPrice,
    revenue,
    grossProfit,
    grossMargin,
    amazonReferral,
    fba,
    amazonTransfer,
    webPay,
    webShip,
    tiktokFee,
    tiktokShip,
    marketing,
    channelAndMarketing,
    contribution,
    contributionMargin,
    lines,
  };
}

export function scaleOrder(input: MarginInput, nextBands: number, price = input.price): MarginInput {
  const bands = units(nextBands);
  const ratio = units(input.bands) > 0 ? bands / units(input.bands) : 1;
  const unsold = Math.min(bands, units(input.unsold * ratio));
  const capacity = bands - unsold;
  const channels = assignChannels(
    capacity,
    units(input.amazonUnits * ratio),
    units(input.websiteUnits * ratio),
    units(input.tiktokUnits * ratio),
  );
  const assigned = channels.amazon + channels.website + channels.tiktok;
  return {
    ...input,
    bands,
    price: cents(n(price)),
    straps: units(input.straps * ratio),
    unsold: unsold + (capacity - assigned),
    amazonUnits: channels.amazon,
    websiteUnits: channels.website,
    tiktokUnits: channels.tiktok,
  };
}
