import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseAvalaraRates, percentFromRate, taxPercentLabel, type AvalaraZipRate } from "@/lib/tax/avalara";
import { requirePortalApi } from "@/lib/portal/api";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const rateSchema = z.object({
  country: z.string().trim().length(2),
  ratePercent: z.number().min(0).max(100),
});

const startSchema = z.object({
  action: z.literal("start"),
  label: z.string().trim().min(1).max(180),
});

const importSchema = z.object({
  action: z.enum(["finish", "discard"]),
  importId: z.uuid(),
});

const refreshSchema = z.object({
  action: z.literal("refresh"),
});

const lookupSchema = z.object({
  action: z.literal("lookup"),
  zip: z.string().trim().min(5).max(10),
});

export async function GET() {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const [countries, rates, imports, zips, stored, updated] = await Promise.all([
    session.supabase.from("sell_countries").select("code, name, currency").eq("enabled", true).order("name"),
    session.supabase.from("country_tax_rates").select("country_code, rate_percent, updated_at"),
    session.supabase.from("tax_imports").select("id, filename, uploaded_at, row_count, state_codes").gt("row_count", 0).order("uploaded_at", { ascending: false }).limit(5),
    session.supabase.from("us_zip_tax_rates").select("zip", { count: "exact", head: true }),
    session.supabase.from("tax_csv_files").select("import_id, filename, created_at").order("filename"),
    session.supabase.from("us_zip_tax_rates").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (countries.error || rates.error || imports.error || stored.error || updated.error) {
    return NextResponse.json({ error: "Sales tax could not be loaded." }, { status: 400 });
  }
  const currentId = imports.data?.[0]?.id ?? "";
  const currentFiles = (stored.data ?? [])
    .filter((file) => file.import_id === currentId)
    .map((file) => ({ name: file.filename, updatedAt: file.created_at }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const currentImport = imports.data?.[0];
  return NextResponse.json({
    countries: countries.data ?? [],
    rates: rates.data ?? [],
    imports: imports.data ?? [],
    zipCount: zips.count ?? 0,
    storedFolder: currentImport?.filename ?? "",
    storedFiles: currentFiles,
    ratesUpdatedAt: updated.data?.updated_at ?? null,
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const body = await request.json().catch(() => null);
    const looking = lookupSchema.safeParse(body);
    if (looking.success) return lookupZip(session.supabase as SupabaseClient, looking.data.zip);
    if (!isServiceRoleConfigured()) return NextResponse.json({ error: "The rate table could not be saved." }, { status: 503 });
    const started = startSchema.safeParse(body);
    if (started.success) return startImport(started.data.label);
    const refreshing = refreshSchema.safeParse(body);
    if (refreshing.success) return refreshRates(session.supabase as SupabaseClient, viewAs);
    const staged = importSchema.safeParse(body);
    if (staged.success && staged.data.action === "discard") return discardImport(staged.data.importId);
    if (staged.success) return finishImport(staged.data.importId, session.supabase as SupabaseClient, viewAs, true);
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a sales tax percent from 0 to 100." }, { status: 400 });
  const code = parsed.data.country.toUpperCase();
  const known = await session.supabase.from("sell_countries").select("code, name").eq("code", code).eq("enabled", true).maybeSingle();
    if (known.error || !known.data) return NextResponse.json({ error: "Turn that country on before setting its tax." }, { status: 400 });
    const saved = await session.supabase.from("country_tax_rates").upsert({
      country_code: code,
      rate_percent: parsed.data.ratePercent,
      updated_at: new Date().toISOString(),
    });
    if (saved.error) return NextResponse.json({ error: "That tax rate could not be saved." }, { status: 400 });
    await session.supabase.rpc("record_audit", {
      p_action: "save_country_tax",
      p_entity: "country_tax_rates",
      p_entity_id: code,
      p_detail: { ratePercent: parsed.data.ratePercent, name: known.data.name, fallback: code === "US" },
      p_view_as: viewAs,
    });
    return NextResponse.json({ ok: true });
  }
  if (!isServiceRoleConfigured()) return NextResponse.json({ error: "The rate table could not be saved." }, { status: 503 });
  return storeFile(request);
}

function percentLabel(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const rate = Number(value);
  if (!Number.isFinite(rate)) return "";
  return taxPercentLabel(percentFromRate(rate));
}

async function lookupZip(supabase: SupabaseClient, rawZip: string) {
  const digits = rawZip.replace(/\D/g, "");
  const zip = digits.slice(0, 5);
  if (!/^[0-9]{5}$/.test(zip)) return NextResponse.json({ error: "Enter a 5-digit ZIP code." }, { status: 400 });
  const found = await supabase
    .from("us_zip_tax_rates")
    .select("zip, state, region_name, combined_rate, state_rate, county_rate, city_rate, special_rate")
    .eq("zip", zip)
    .maybeSingle();
  if (found.error) return NextResponse.json({ error: "That ZIP code could not be looked up." }, { status: 400 });
  if (!found.data) return NextResponse.json({ error: "No tax rate is stored for that ZIP code." }, { status: 404 });
  const row = found.data;
  return NextResponse.json({
    zip: row.zip,
    state: row.state,
    regionName: row.region_name,
    combined: percentLabel(row.combined_rate),
    stateRate: percentLabel(row.state_rate),
    countyRate: percentLabel(row.county_rate),
    cityRate: percentLabel(row.city_rate),
    specialRate: percentLabel(row.special_rate),
  });
}

async function startImport(label: string) {
  const admin = createAdminClient();
  const imported = await admin.from("tax_imports").insert({
    filename: label,
    row_count: 0,
    state_codes: "",
  }).select("id").single();
  if (imported.error || !imported.data) return NextResponse.json({ error: "The upload could not be started." }, { status: 400 });
  return NextResponse.json({ importId: imported.data.id });
}

async function storeFile(request: Request) {
  const form = await request.formData().catch(() => null);
  const importId = String(form?.get("importId") ?? "");
  const file = form?.get("file");
  if (!z.uuid().safeParse(importId).success || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose an Avalara CSV file." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv") || file.size === 0) {
    return NextResponse.json({ error: `${file.name} is not a CSV file.` }, { status: 400 });
  }
  if (file.size > 8_000_000) return NextResponse.json({ error: `${file.name} is larger than 8 MB.` }, { status: 400 });
  const body = await file.text();
  try {
    parseAvalaraRates(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "That CSV could not be read.";
    return NextResponse.json({ error: `${file.name}: ${message}` }, { status: 400 });
  }
  const admin = createAdminClient();
  const filename = file.name.split(/[/\\]/).pop()?.slice(0, 180) || "rates.csv";
  const storagePath = `${importId}/${filename.replace(/[^A-Za-z0-9._-]+/g, "_")}`;
  const uploaded = await admin.storage.from("tax-rates").upload(storagePath, Buffer.from(body), {
    contentType: "text/csv",
    upsert: true,
  });
  if (uploaded.error) return NextResponse.json({ error: `${filename} could not be saved.` }, { status: 400 });
  const saved = await admin.from("tax_csv_files").upsert({
    import_id: importId,
    filename,
    body,
  }, { onConflict: "import_id,filename" });
  if (saved.error) {
    await admin.storage.from("tax-rates").remove([storagePath]);
    return NextResponse.json({ error: `${filename} could not be copied.` }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

async function removeRateFolder(importId: string) {
  const admin = createAdminClient();
  const listed = await admin.storage.from("tax-rates").list(importId, { limit: 200 });
  const paths = (listed.data ?? []).map((item) => `${importId}/${item.name}`);
  if (paths.length) await admin.storage.from("tax-rates").remove(paths);
}

async function ratesFromFiles(files: { filename: string; body: string }[]) {
  const byZip = new Map<string, AvalaraZipRate>();
  for (const file of files) {
    try {
      for (const rate of parseAvalaraRates(file.body)) byZip.set(rate.zip, rate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "That CSV could not be read.";
      throw new Error(`${file.filename}: ${message}`);
    }
  }
  if (byZip.size === 0) throw new Error("Those CSV files have no tax rates.");
  return [...byZip.values()];
}

async function finishImport(importId: string, supabase: SupabaseClient, viewAs: string, discardOnError: boolean) {
  const admin = createAdminClient();
  const files = await admin.from("tax_csv_files").select("filename, body").eq("import_id", importId).order("filename");
  if (files.error || !files.data?.length) {
    return NextResponse.json({ error: "No CSV files were copied." }, { status: 400 });
  }
  let rates: AvalaraZipRate[];
  try {
    rates = await ratesFromFiles(files.data);
  } catch (error) {
    if (discardOnError) await discardImport(importId);
    const message = error instanceof Error ? error.message : "Those CSV files could not be read.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const replaced = await admin.rpc("replace_zip_tax_rates", {
    p_import: importId,
    p_rows: rates.map((rate) => ({
      zip: rate.zip,
      state: rate.state,
      region_name: rate.regionName.slice(0, 120),
      combined_rate: rate.combinedRate,
      state_rate: rate.stateRate,
      county_rate: rate.countyRate,
      city_rate: rate.cityRate,
      special_rate: rate.specialRate,
      risk_level: rate.riskLevel,
    })),
  });
  if (replaced.error) {
    if (discardOnError) await discardImport(importId);
    const detail = replaced.error.message?.slice(0, 180) || "The tax rate table could not be updated.";
    return NextResponse.json({ error: detail }, { status: 400 });
  }
  const previous = await admin.from("tax_csv_files").select("import_id").neq("import_id", importId);
  const previousIds = [...new Set((previous.data ?? []).map((row) => row.import_id))];
  await admin.from("tax_csv_files").delete().neq("import_id", importId);
  for (const id of previousIds) await removeRateFolder(id);
  const states = [...new Set(rates.map((rate) => rate.state))].sort();
  await admin.from("tax_imports").update({
    row_count: rates.length,
    state_codes: states.join(",").slice(0, 400),
  }).eq("id", importId);
  await supabase.rpc("record_audit", {
    p_action: discardOnError ? "upload_tax_table" : "refresh_tax_table",
    p_entity: "tax_imports",
    p_entity_id: importId,
    p_detail: { files: files.data.length, rows: rates.length, states: states.join(",") },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, rows: rates.length, files: files.data.length });
}

async function discardImport(importId: string) {
  const admin = createAdminClient();
  await admin.from("tax_csv_files").delete().eq("import_id", importId);
  await removeRateFolder(importId);
  await admin.from("tax_imports").delete().eq("id", importId).eq("row_count", 0);
  return NextResponse.json({ ok: true });
}

async function refreshRates(supabase: SupabaseClient, viewAs: string) {
  const admin = createAdminClient();
  const latest = await admin.from("tax_imports").select("id").gt("row_count", 0).order("uploaded_at", { ascending: false }).limit(1).maybeSingle();
  if (latest.error || !latest.data) {
    return NextResponse.json({ error: "Upload CSV files before refreshing tax rates." }, { status: 400 });
  }
  return finishImport(latest.data.id, supabase, viewAs, false);
}
