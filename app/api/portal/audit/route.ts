import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi, rpcFailed } from "@/lib/portal/api";

const hidden = /password|token|secret|service_role|api_key/i;

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  entity: z.string().trim().max(80).default(""),
  action: z.string().trim().max(80).default(""),
  actor: z.string().trim().max(80).default(""),
  from: z.string().trim().max(40).default(""),
  to: z.string().trim().max(40).default(""),
  keyword: z.string().trim().max(120).default(""),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
  confirm: z.literal("PERMANENT DELETE"),
  reason: z.string().trim().min(1).max(500),
});

function preview(value: unknown) {
  if (value === null || value === undefined || value === "") return "empty";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function changedFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const left = before ?? {};
  const right = after ?? {};
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].filter((key) => key !== "updated_at");
  const rows: { field: string; from: string; to: string }[] = [];
  let more = false;
  for (const key of keys) {
    if (JSON.stringify(left[key]) === JSON.stringify(right[key])) continue;
    if (rows.length === 8) {
      more = true;
      break;
    }
    if (hidden.test(key)) {
      rows.push({ field: key, from: "hidden", to: "hidden" });
      continue;
    }
    rows.push({
      field: key,
      from: before ? preview(left[key]) : "",
      to: after ? preview(right[key]) : "",
    });
  }
  return { rows, more };
}

function instant(value: string) {
  if (!value) return null;
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? undefined : time.toISOString();
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function GET(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const url = new URL(request.url);
  const parsed = filtersSchema.safeParse({
    page: url.searchParams.get("page") ?? 1,
    entity: url.searchParams.get("entity") ?? "",
    action: url.searchParams.get("action") ?? "",
    actor: url.searchParams.get("actor") ?? "",
    from: url.searchParams.get("from") ?? "",
    to: url.searchParams.get("to") ?? "",
    keyword: url.searchParams.get("keyword") ?? "",
  });
  if (!parsed.success) return NextResponse.json({ error: "Those filters could not be read." }, { status: 400 });
  const filters = parsed.data;
  const from = instant(filters.from);
  const to = instant(filters.to);
  if (from === undefined || to === undefined) {
    return NextResponse.json({ error: "Use a real date." }, { status: 400 });
  }
  if (from && to && from > to) {
    return NextResponse.json({ error: "The start date has to be on or before the end date." }, { status: 400 });
  }

  const settings = await gate.session.supabase.from("site_settings").select("list_page_size").eq("id", 1).maybeSingle();
  const pageSize = Math.min(100, Math.max(1, Number(settings.data?.list_page_size) || 10));
  const [listed, facets] = await Promise.all([
    gate.session.supabase.rpc("list_audit", {
      p_entity: filters.entity,
      p_action: filters.action,
      p_actor: filters.actor,
      p_from: from,
      p_to: to,
      p_keyword: filters.keyword,
      p_limit: pageSize,
      p_offset: (filters.page - 1) * pageSize,
    }),
    gate.session.supabase.rpc("audit_facets", {
      p_from: from,
      p_to: to,
      p_keyword: filters.keyword,
    }),
  ]);
  const listError = rpcFailed(listed.data, listed.error);
  if (listError) return NextResponse.json({ error: "The audit log could not be loaded." }, { status: 400 });
  const facetError = rpcFailed(facets.data, facets.error);
  if (facetError) return NextResponse.json({ error: "The audit log could not be loaded." }, { status: 400 });

  const total = Number(listed.data?.total) || 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const rawRows = Array.isArray(listed.data?.rows) ? listed.data.rows : [];
  return NextResponse.json({
    page: filters.page,
    pages,
    pageSize,
    total,
    entities: Array.isArray(facets.data?.entities) ? facets.data.entities.filter((item: unknown) => typeof item === "string") : [],
    actions: Array.isArray(facets.data?.actions) ? facets.data.actions.filter((item: unknown) => typeof item === "string") : [],
    actors: Array.isArray(facets.data?.actors)
      ? facets.data.actors.filter((item: unknown) => item && typeof item === "object" && typeof (item as { id?: unknown }).id === "string")
      : [],
    rows: rawRows.map((row: Record<string, unknown>) => {
      const before = asRecord(row.before);
      const after = asRecord(row.after);
      const detail = !before && !after ? asRecord(row.detail) : null;
      const fields = detail
        ? {
            rows: Object.entries(detail).slice(0, 8).map(([field, value]) => ({ field, from: "", to: preview(value) })),
            more: Object.keys(detail).length > 8,
          }
        : changedFields(before, after);
      return {
        id: String(row.id),
        action: String(row.action ?? ""),
        entity: String(row.entity ?? ""),
        entityId: typeof row.entity_id === "string" ? row.entity_id : null,
        reason: typeof row.reason === "string" ? row.reason : null,
        viewAs: typeof row.view_as === "string" ? row.view_as : null,
        createdAt: String(row.created_at ?? ""),
        actor: typeof row.actor_name === "string" && row.actor_name ? row.actor_name : "System",
        email: typeof row.actor_email === "string" ? row.actor_email : "",
        changes: fields.rows,
        more: fields.more,
      };
    }),
  });
}

export async function POST(request: Request) {
  const gate = await requirePortalApi(["admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Type PERMANENT DELETE and give a reason." }, { status: 400 });
  }
  const removed = await gate.session.supabase.rpc("delete_audit_entry", {
    p_id: parsed.data.id,
    p_confirm: parsed.data.confirm,
    p_reason: parsed.data.reason,
  });
  const message = rpcFailed(removed.data, removed.error);
  if (message) return NextResponse.json({ error: message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
