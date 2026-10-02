import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { carrierCodes, isCarrierCode } from "@/lib/shipping/carriers";
import { shippingCodes, type ShippingOption } from "@/lib/shipping/options";

const optionSchema = z.object({
  code: z.enum(shippingCodes),
  price: z.number().min(0).max(100000),
  minDays: z.number().int().min(0).max(60),
  maxDays: z.number().int().min(0).max(60),
  enabled: z.boolean(),
});

const bodySchema = z.object({
  options: z.array(optionSchema).length(shippingCodes.length),
});

const rateSchema = z.object({
  id: z.uuid(),
  carrier: z.enum(carrierCodes),
  service: z.string().trim().min(1).max(80),
  maxWeightLb: z.number().positive().max(150),
  maxLengthIn: z.number().positive().max(108),
  maxWidthIn: z.number().positive().max(108),
  maxHeightIn: z.number().positive().max(108),
  carrierPrice: z.number().min(0).max(100000),
  ourPrice: z.number().min(0).max(100000).nullable(),
  detail: z.string().trim().max(160).default(""),
});

const ratesSchema = z.object({
  kind: z.literal("rates"),
  rates: z.array(rateSchema).max(60),
});

function asOption(row: {
  code: string;
  name: string;
  price: number | string;
  min_days: number;
  max_days: number;
  enabled: boolean;
}): ShippingOption | null {
  if (!shippingCodes.includes(row.code as ShippingOption["code"])) return null;
  return {
    code: row.code as ShippingOption["code"],
    name: row.name,
    price: Number(row.price),
    minDays: row.min_days,
    maxDays: row.max_days,
    enabled: row.enabled,
  };
}

export async function GET() {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const [options, rates] = await Promise.all([
    session.supabase.from("shipping_options").select("code, name, price, min_days, max_days, enabled, sort").order("sort"),
    session.supabase.from("shipping_carrier_rates").select("id, carrier, service, max_weight_lb, max_length_in, max_width_in, max_height_in, carrier_price, our_price, detail, sort").order("sort"),
  ]);
  if (options.error || rates.error) return NextResponse.json({ error: "Shipping options could not be loaded." }, { status: 400 });
  return NextResponse.json({
    options: (options.data ?? []).map(asOption).filter((option): option is ShippingOption => option !== null),
    rates: (rates.data ?? []).flatMap((row) => {
      if (!isCarrierCode(row.carrier)) return [];
      return [{
        id: row.id,
        carrier: row.carrier,
        service: row.service,
        maxWeightLb: Number(row.max_weight_lb),
        maxLengthIn: Number(row.max_length_in),
        maxWidthIn: Number(row.max_width_in),
        maxHeightIn: Number(row.max_height_in),
        carrierPrice: Number(row.carrier_price),
        ourPrice: row.our_price === null || row.our_price === undefined ? null : Number(row.our_price),
        detail: row.detail ?? "",
      }];
    }),
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["inventory"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const body = await request.json().catch(() => null);
  const ratesParsed = ratesSchema.safeParse(body);
  if (body && typeof body === "object" && (body as { kind?: unknown }).kind === "rates") {
    if (!ratesParsed.success) return NextResponse.json({ error: "Check the weight, size, and carrier price for each rate." }, { status: 400 });
    const cleared = await session.supabase.from("shipping_carrier_rates").delete().in("carrier", [...carrierCodes]);
    if (cleared.error) return NextResponse.json({ error: "Carrier rates could not be saved." }, { status: 400 });
    if (ratesParsed.data.rates.length) {
      const saved = await session.supabase.from("shipping_carrier_rates").insert(ratesParsed.data.rates.map((rate, index) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        max_weight_lb: rate.maxWeightLb,
        max_length_in: rate.maxLengthIn,
        max_width_in: rate.maxWidthIn,
        max_height_in: rate.maxHeightIn,
        carrier_price: rate.carrierPrice,
        our_price: rate.ourPrice,
        detail: rate.detail,
        sort: index,
      })));
      if (saved.error) return NextResponse.json({ error: "Carrier rates could not be saved." }, { status: 400 });
    }
    await session.supabase.rpc("record_audit", {
      p_action: "save_carrier_rates",
      p_entity: "shipping_carrier_rates",
      p_entity_id: "US",
      p_detail: { count: ratesParsed.data.rates.length },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the price and delivery days." }, { status: 400 });
  const seen = new Set(parsed.data.options.map((option) => option.code));
  if (seen.size !== shippingCodes.length) return NextResponse.json({ error: "Save Free Shipping, Standard Shipping, and Expedited Shipping together." }, { status: 400 });
  const late = parsed.data.options.find((option) => option.maxDays < option.minDays);
  if (late) return NextResponse.json({ error: "The latest day has to be on or after the earliest." }, { status: 400 });

  for (const option of parsed.data.options) {
    const saved = await session.supabase.from("shipping_options").update({
      price: option.price,
      min_days: option.minDays,
      max_days: option.maxDays,
      enabled: option.enabled,
    }).eq("code", option.code);
    if (saved.error) return NextResponse.json({ error: "Shipping options could not be saved." }, { status: 400 });
  }
  await session.supabase.rpc("record_audit", {
    p_action: "save_shipping_options",
    p_entity: "shipping_options",
    p_entity_id: "US",
    p_detail: {
      options: parsed.data.options.map((option) => ({
        code: option.code,
        price: option.price,
        minDays: option.minDays,
        maxDays: option.maxDays,
        enabled: option.enabled,
      })),
    },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
