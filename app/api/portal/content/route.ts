import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";

export async function GET() {
  const gate = await requirePortalApi(["content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session } = gate;
  const [settings, policies, pages, posts, sections, videos, help, social, channels, links, nav, blocks, reviews, payments, stores] =
    await Promise.all([
      session.supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      session.supabase.from("policies").select("*").eq("id", 1).maybeSingle(),
      session.supabase.from("page_copy").select("page, key, value, deleted_at").order("page"),
      session.supabase.from("blog_posts").select("*"),
      session.supabase.from("blog_sections").select("*").order("sort"),
      session.supabase.from("videos").select("*"),
      session.supabase.from("help_articles").select("*").order("sort"),
      session.supabase.from("social_links").select("*").order("sort"),
      session.supabase.from("support_channels").select("*").order("sort"),
      session.supabase.from("support_links").select("*").order("sort"),
      session.supabase.from("nav_items").select("*").order("sort"),
      session.supabase.from("product_blocks").select("id, product_id, kind, payload, deleted_at"),
      session.supabase.from("reviews").select("id, product_id, author, body, verified, published, created_at, deleted_at").order("created_at", { ascending: false }),
      session.supabase.from("payment_methods").select("id, label, offered, deleted_at").order("sort"),
      session.supabase.from("store_links").select("id, label, href, enabled, sort, deleted_at").order("sort"),
    ]);
  return NextResponse.json({
    settings: settings.data,
    policies: policies.data,
    pages: pages.data ?? [],
    posts: posts.data ?? [],
    sections: sections.data ?? [],
    videos: videos.data ?? [],
    help: help.data ?? [],
    social: social.data ?? [],
    channels: channels.data ?? [],
    links: links.data ?? [],
    nav: nav.data ?? [],
    blocks: blocks.data ?? [],
    reviews: reviews.data ?? [],
    payments: payments.data ?? [],
    stores: stores.data ?? [],
  });
}

const saveSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("headerChrome"),
    noticePrimary: z.string().trim().max(200),
    noticePrimaryEnabled: z.boolean(),
    noticePrimaryColor: z.enum(["red", "orange", "blue", "green", "white"]),
    noticePrimaryBackground: z.enum(["ink", "white", "red", "orange", "blue"]),
    noticeSecondary: z.string().trim().max(200),
    noticeSecondaryEnabled: z.boolean(),
    noticeSecondaryColor: z.enum(["red", "orange", "blue", "green", "white"]),
    noticeSecondaryBackground: z.enum(["ink", "white", "red", "orange", "blue"]),
    headerSlogan: z.string().trim().min(1).max(120),
  }),
  z.object({
    kind: z.literal("footerChrome"),
    footerBlurb: z.string().trim().min(1).max(500),
    footerMarketplaces: z.string().trim().max(240),
    legalName: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(120),
    copyright: z.string().trim().min(1).max(160),
  }),
  z.object({
    kind: z.literal("footerPayments"),
    offered: z.array(z.string().trim().min(1).max(40)).max(20),
  }),
  z.object({
    kind: z.literal("footerSocial"),
    links: z.array(z.object({
      id: z.string().trim().min(1).max(40),
      href: z.string().trim().max(300),
      enabled: z.boolean(),
    })).max(12),
  }),
  z.object({
    kind: z.literal("footerStores"),
    stores: z.array(z.object({
      id: z.string().trim().min(1).max(40),
      href: z.string().trim().max(300),
      enabled: z.boolean(),
    })).max(20),
  }),
  z.object({
    kind: z.literal("footerStoreAdd"),
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().max(300),
    enabled: z.boolean(),
  }),
  z.object({
    kind: z.literal("settings"),
    announcement: z.string().trim().min(1).max(200),
    siteDescription: z.string().trim().min(1).max(500),
    email: z.email(),
    supportHours: z.string().trim().min(1).max(200),
    siteUrl: z.string().trim().url().max(200),
    brand: z.string().trim().min(1).max(80),
    address: z.string().trim().min(1).max(120),
    noSubscription: z.string().trim().min(1).max(80),
    listPageSize: z.number().int().min(1).max(100).optional(),
  }),
  z.object({
    kind: z.literal("policies"),
    shipping: z.string().trim().min(1).max(500),
    returnsSummary: z.string().trim().min(1).max(800),
    warrantyRegistration: z.string().trim().min(1).max(800),
    accountSummary: z.string().trim().min(1).max(800),
    heroLine: z.string().trim().min(1).max(200),
    returnsTitle: z.string().trim().min(1).max(200).optional(),
    strapTitle: z.string().trim().min(1).max(200).optional(),
    dockTitle: z.string().trim().min(1).max(200).optional(),
    strapSummary: z.string().trim().min(1).max(800).optional(),
    dockSummary: z.string().trim().min(1).max(800).optional(),
  }),
  z.object({
    kind: z.literal("section"),
    id: z.string().trim().min(1).max(160),
    heading: z.string().trim().min(1).max(160),
    paragraphs: z.string().trim().min(1).max(8000),
  }),
  z.object({
    kind: z.literal("nav"),
    id: z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),
    area: z.enum(["header", "footer"]),
    parentId: z.string().trim().max(80).nullable(),
    itemKind: z.enum(["link", "menu", "products"]),
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().max(200),
    sort: z.number().int().min(0).max(999),
    published: z.boolean(),
  }),
  z.object({
    kind: z.literal("supportLink"),
    href: z.string().trim().min(1).max(160),
    label: z.string().trim().min(1).max(80),
  }),
  z.object({
    kind: z.literal("page"),
    page: z.string().trim().min(1).max(40),
    key: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(8000),
  }),
  z.object({
    kind: z.literal("video"),
    id: z.string().trim().min(1).max(80),
    productId: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(120),
    youtubeId: z.string().trim().min(5).max(20),
    published: z.boolean(),
  }),
  z.object({
    kind: z.literal("help"),
    slug: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(140),
    summary: z.string().trim().min(1).max(300),
    body: z.string().trim().min(1).max(8000),
    published: z.boolean(),
  }),
  z.object({
    kind: z.literal("social"),
    id: z.string().trim().min(1).max(40),
    label: z.string().trim().min(1).max(40),
    href: z.string().trim().url().max(300),
  }),
  z.object({
    kind: z.literal("channel"),
    id: z.string().trim().min(1).max(40),
    label: z.string().trim().min(1).max(40),
    reply: z.string().trim().min(1).max(200),
    href: z.string().trim().max(300).nullable(),
  }),
  z.object({
    kind: z.literal("review"),
    productId: z.string().trim().min(1).max(40),
    author: z.string().trim().min(1).max(80),
    body: z.string().trim().min(3).max(2000),
    verified: z.boolean(),
    published: z.boolean(),
  }),
  z.object({
    kind: z.literal("reviewPublish"),
    id: z.uuid(),
    published: z.boolean(),
  }),
  z.object({
    kind: z.literal("block"),
    id: z.string().trim().min(1).max(80),
    payload: z.string().trim().min(2).max(20000),
  }),
  z.object({
    kind: z.literal("blog"),
    slug: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().min(1).max(400),
    description: z.string().trim().min(1).max(300),
    published: z.boolean(),
  }),
]);

export async function POST(request: Request) {
  const gate = await requirePortalApi(["content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the content fields." }, { status: 400 });
  const body = parsed.data;
  let error: { message: string } | null = null;
  let entityId = "";

  if (body.kind === "headerChrome") {
    entityId = "header";
    const result = await session.supabase.from("site_settings").update({
      notice_primary: body.noticePrimary,
      notice_primary_enabled: body.noticePrimaryEnabled,
      notice_primary_color: body.noticePrimaryColor,
      notice_primary_background: body.noticePrimaryBackground,
      notice_secondary: body.noticeSecondary,
      notice_secondary_enabled: body.noticeSecondaryEnabled,
      notice_secondary_color: body.noticeSecondaryColor,
      notice_secondary_background: body.noticeSecondaryBackground,
      announcement: body.noticeSecondary || "Free US shipping · 30-day free returns",
      header_slogan: body.headerSlogan,
    }).eq("id", 1);
    error = result.error;
  } else if (body.kind === "footerChrome") {
    entityId = "footer";
    const result = await session.supabase.from("site_settings").update({
      footer_blurb: body.footerBlurb,
      footer_marketplaces: body.footerMarketplaces,
      legal_name: body.legalName,
      address: body.address,
      copyright: body.copyright,
    }).eq("id", 1);
    error = result.error;
  } else if (body.kind === "footerPayments") {
    entityId = "payments";
    const current = await session.supabase.from("payment_methods").select("id, label").is("deleted_at", null);
    if (current.error) error = current.error;
    else {
      const offered = new Set(body.offered);
      for (const method of current.data ?? []) {
        const result = await session.supabase.from("payment_methods").update({ offered: offered.has(method.id) }).eq("id", method.id);
        if (result.error) {
          error = result.error;
          break;
        }
      }
    }
  } else if (body.kind === "footerSocial") {
    entityId = "social";
    const current = await session.supabase.from("social_links").select("id, label").is("deleted_at", null);
    if (current.error) error = current.error;
    else {
      const known = new Map((current.data ?? []).map((link) => [link.id, link.label]));
      for (const link of body.links) {
        if (!known.has(link.id)) continue;
        const address = z.url().safeParse(link.href);
        if (!address.success) {
          return NextResponse.json({ error: `${known.get(link.id)}. Enter a full link starting with https://.` }, { status: 400 });
        }
        const result = await session.supabase.from("social_links").update({ href: link.href, enabled: link.enabled }).eq("id", link.id);
        if (result.error) {
          error = result.error;
          break;
        }
      }
    }
  } else if (body.kind === "footerStores") {
    entityId = "stores";
    const current = await session.supabase.from("store_links").select("id, label").is("deleted_at", null);
    if (current.error) error = current.error;
    else {
      const known = new Map((current.data ?? []).map((store) => [store.id, store.label]));
      for (const store of body.stores) {
        if (!known.has(store.id)) continue;
        if (store.href && !z.url().safeParse(store.href).success) {
          return NextResponse.json({ error: `${known.get(store.id)}. Enter a full link starting with https://.` }, { status: 400 });
        }
        const result = await session.supabase.from("store_links").update({ href: store.href, enabled: store.enabled }).eq("id", store.id);
        if (result.error) {
          error = result.error;
          break;
        }
      }
    }
  } else if (body.kind === "footerStoreAdd") {
    entityId = "stores";
    if (body.href && !z.url().safeParse(body.href).success) {
      return NextResponse.json({ error: `${body.label}. Enter a full link starting with https://.` }, { status: 400 });
    }
    const existing = await session.supabase.from("store_links").select("id, sort");
    if (existing.error) error = existing.error;
    else {
      const slug = body.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "store";
      let id = slug;
      let count = 2;
      const taken = new Set((existing.data ?? []).map((store) => store.id));
      while (taken.has(id)) {
        id = `${slug.slice(0, 36)}-${count}`;
        count += 1;
      }
      const sort = (existing.data ?? []).reduce((max, store) => Math.max(max, Number(store.sort ?? 0)), -1) + 1;
      const result = await session.supabase.from("store_links").insert({
        id,
        label: body.label,
        href: body.href,
        enabled: body.enabled,
        sort,
      });
      error = result.error;
    }
  } else if (body.kind === "settings") {
    entityId = "site";
    const result = await session.supabase.from("site_settings").update({
      announcement: body.announcement,
      site_description: body.siteDescription,
      email: body.email,
      support_hours: body.supportHours,
      site_url: body.siteUrl,
      brand: body.brand,
      address: body.address,
      no_subscription: body.noSubscription,
      ...(body.listPageSize ? { list_page_size: body.listPageSize } : {}),
    }).eq("id", 1);
    error = result.error;
  } else if (body.kind === "policies") {
    entityId = "policies";
    const result = await session.supabase.from("policies").update({
      shipping: body.shipping,
      returns_summary: body.returnsSummary,
      warranty_registration: body.warrantyRegistration,
      account_summary: body.accountSummary,
      hero_line: body.heroLine,
      ...(body.returnsTitle ? { returns_title: body.returnsTitle } : {}),
      ...(body.strapTitle ? { strap_title: body.strapTitle } : {}),
      ...(body.dockTitle ? { dock_title: body.dockTitle } : {}),
      ...(body.strapSummary ? { strap_summary: body.strapSummary } : {}),
      ...(body.dockSummary ? { dock_summary: body.dockSummary } : {}),
    }).eq("id", 1);
    error = result.error;
  } else if (body.kind === "page") {
    entityId = `${body.page}.${body.key}`;
    const result = await session.supabase.from("page_copy").upsert({ page: body.page, key: body.key, value: body.value });
    error = result.error;
  } else if (body.kind === "video") {
    entityId = body.id;
    const result = await session.supabase.from("videos").upsert({
      id: body.id,
      product_id: body.productId,
      title: body.title,
      youtube_id: body.youtubeId,
      published: body.published,
    });
    error = result.error;
  } else if (body.kind === "help") {
    entityId = body.slug;
    const result = await session.supabase.from("help_articles").upsert({
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      body: body.body,
      published: body.published,
    });
    error = result.error;
  } else if (body.kind === "social") {
    entityId = body.id;
    const result = await session.supabase.from("social_links").update({ label: body.label, href: body.href }).eq("id", body.id);
    error = result.error;
  } else if (body.kind === "channel") {
    entityId = body.id;
    const result = await session.supabase.from("support_channels").update({
      label: body.label,
      reply: body.reply,
      href: body.href,
    }).eq("id", body.id);
    error = result.error;
  } else if (body.kind === "reviewPublish") {
    entityId = body.id;
    const result = await session.supabase.from("reviews").update({ published: body.published }).eq("id", body.id);
    error = result.error;
  } else if (body.kind === "review") {
    entityId = body.productId;
    const result = await session.supabase.from("reviews").insert({
      product_id: body.productId,
      author: body.author,
      body: body.body,
      verified: body.verified,
      published: body.published,
    });
    error = result.error;
  } else if (body.kind === "block") {
    entityId = body.id;
    let payload: unknown;
    try {
      payload = JSON.parse(body.payload);
    } catch {
      return NextResponse.json({ error: "The block has to be valid JSON." }, { status: 400 });
    }
    const result = await session.supabase.from("product_blocks").update({ payload }).eq("id", body.id);
    error = result.error;
  } else if (body.kind === "section") {
    entityId = body.id;
    const paragraphs = body.paragraphs.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    const result = await session.supabase.from("blog_sections").update({
      heading: body.heading,
      paragraphs,
    }).eq("id", body.id);
    error = result.error;
  } else if (body.kind === "nav") {
    entityId = body.id;
    if (body.itemKind === "link" && body.href.length === 0) {
      return NextResponse.json({ error: "A link needs a path." }, { status: 400 });
    }
    if (body.itemKind === "products" && (body.area !== "header" || body.parentId)) {
      return NextResponse.json({ error: "Products stays a top-level header item." }, { status: 400 });
    }
    const result = await session.supabase.from("nav_items").upsert({
      id: body.id,
      area: body.area,
      parent_id: body.parentId || null,
      kind: body.itemKind,
      label: body.label,
      href: body.href,
      sort: body.sort,
      published: body.published,
    });
    error = result.error;
  } else if (body.kind === "supportLink") {
    entityId = body.href;
    const result = await session.supabase.from("support_links").update({ label: body.label }).eq("href", body.href);
    error = result.error;
  } else {
    entityId = body.slug;
    const result = await session.supabase.from("blog_posts").update({
      title: body.title,
      excerpt: body.excerpt,
      description: body.description,
      published: body.published,
    }).eq("slug", body.slug);
    error = result.error;
  }

  if (error) return NextResponse.json({ error: "That content could not be saved." }, { status: 400 });
  await session.supabase.rpc("record_audit", {
    p_action: "save_content",
    p_entity: body.kind,
    p_entity_id: entityId,
    p_detail: { kind: body.kind, id: entityId },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}
