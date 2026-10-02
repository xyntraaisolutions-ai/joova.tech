import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalApi } from "@/lib/portal/api";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export const maxDuration = 120;

const articleSchema = z.object({
  title: z.string().trim().min(8).max(140),
  description: z.string().trim().min(12).max(300),
  excerpt: z.string().trim().min(12).max(400),
  points: z.array(z.string().trim().min(2).max(140)).min(3).max(6),
  sections: z.array(z.object({
    id: z.string().trim().min(1).max(40),
    heading: z.string().trim().min(2).max(90),
    paragraphs: z.array(z.string().trim().min(12).max(1200)).min(1).max(4),
  })).min(3).max(6),
  bannerAlt: z.string().trim().min(4).max(180),
  imagePrompt: z.string().trim().max(800).optional(),
});

const generateSchema = z.object({
  action: z.literal("generate"),
  topic: z.string().trim().min(8).max(400),
  productId: z.string().trim().max(40).optional(),
});

const bannerSchema = z.object({
  action: z.literal("banner"),
  slug: z.string().trim().min(1).max(120),
});

const publishSchema = z.object({
  action: z.literal("publish"),
  slug: z.string().trim().min(1).max(120),
  published: z.boolean(),
});

export async function POST(request: Request) {
  const gate = await requirePortalApi(["content", "admin"]);
  if ("error" in gate && gate.error) return gate.error;
  const { session, viewAs } = gate;
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("multipart/form-data")) return uploadBanner(request, session.supabase, viewAs);

  const body = await request.json().catch(() => null);
  const action = body && typeof body === "object" && "action" in body ? String(body.action) : "";
  if (action === "generate") return createDraft(generateSchema.safeParse(body), session.supabase, viewAs);
  if (action === "banner") return replaceBanner(bannerSchema.safeParse(body), session.supabase, viewAs);
  if (action === "publish") return publishPost(publishSchema.safeParse(body), session.supabase, viewAs);
  return NextResponse.json({ error: "Check the blog fields." }, { status: 400 });
}

async function createDraft(
  parsed: ReturnType<typeof generateSchema.safeParse>,
  supabase: PortalClient,
  viewAs: string,
) {
  if (!parsed.success) return NextResponse.json({ error: "Add a topic of at least a few words." }, { status: 400 });
  const products = await productFacts(supabase);
  const focus = products.some((product) => product.id === parsed.data.productId) ? parsed.data.productId ?? "" : "";
  const written = await askWriter({
    supabase,
    mode: "article",
    topic: parsed.data.topic,
    productId: focus,
    products,
  });
  if (!written.ok) return NextResponse.json({ error: written.error }, { status: written.status });
  const article = articleSchema.safeParse(written.article);
  if (!article.success) return NextResponse.json({ error: "The draft could not be written. Try the topic again." }, { status: 502 });
  const slug = await uniqueSlug(supabase, slugify(article.data.title));
  const words = [article.data.excerpt, ...article.data.sections.flatMap((section) => section.paragraphs)].join(" ").split(/\s+/).length;
  const readingMinutes = Math.min(12, Math.max(3, Math.round(words / 200)));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  const label = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago" }).format(new Date());
  const banner = await storeBanner(supabase, slug, written.imageBase64);
  const related = await supabase.from("blog_posts").select("slug").eq("published", true).neq("slug", slug).limit(1).maybeSingle();
  const inserted = await supabase.from("blog_posts").insert({
    slug,
    product_id: focus,
    title: article.data.title,
    description: article.data.description,
    excerpt: article.data.excerpt,
    published_label: label,
    published_iso: today,
    reading_minutes: readingMinutes,
    points: article.data.points,
    related_slug: related.data?.slug || null,
    published: false,
    banner_url: banner.url,
    banner_alt: article.data.bannerAlt,
  });
  if (inserted.error) return NextResponse.json({ error: "The draft could not be saved." }, { status: 400 });
  const sections = await supabase.from("blog_sections").insert(article.data.sections.map((section, index) => ({
    id: `${slug}-${slugify(section.id) || index + 1}`,
    post_slug: slug,
    section_id: slugify(section.id) || `part-${index + 1}`,
    heading: section.heading,
    paragraphs: section.paragraphs,
    sort: index,
  })));
  if (sections.error) {
    await supabase.from("blog_posts").delete().eq("slug", slug);
    return NextResponse.json({ error: "The draft could not be saved." }, { status: 400 });
  }
  await supabase.rpc("record_audit", {
    p_action: "create_blog",
    p_entity: "blog_posts",
    p_entity_id: slug,
    p_detail: { topic: parsed.data.topic, draft: true },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, slug, notice: banner.notice });
}

async function replaceBanner(
  parsed: ReturnType<typeof bannerSchema.safeParse>,
  supabase: PortalClient,
  viewAs: string,
) {
  if (!parsed.success) return NextResponse.json({ error: "That blog was not found." }, { status: 400 });
  const found = await supabase.from("blog_posts").select("slug, title, excerpt").eq("slug", parsed.data.slug).maybeSingle();
  if (!found.data) return NextResponse.json({ error: "That blog was not found." }, { status: 400 });
  const products = await productFacts(supabase);
  const written = await askWriter({
    supabase,
    mode: "banner",
    title: found.data.title,
    excerpt: found.data.excerpt,
    products,
  });
  if (!written.ok) return NextResponse.json({ error: written.error }, { status: written.status });
  if (!written.imageBase64) return NextResponse.json({ error: written.imageError || "The banner could not be created." }, { status: 502 });
  const banner = await storeBanner(supabase, found.data.slug, written.imageBase64);
  if (!banner.url) return NextResponse.json({ error: banner.notice || "The banner could not be saved." }, { status: 400 });
  const saved = await supabase.from("blog_posts").update({
    banner_url: banner.url,
    banner_alt: written.bannerAlt || found.data.title,
  }).eq("slug", found.data.slug);
  if (saved.error) return NextResponse.json({ error: "The banner could not be saved." }, { status: 400 });
  await supabase.rpc("record_audit", {
    p_action: "blog_banner",
    p_entity: "blog_posts",
    p_entity_id: found.data.slug,
    p_detail: { source: "ai" },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, url: banner.url });
}

async function publishPost(
  parsed: ReturnType<typeof publishSchema.safeParse>,
  supabase: PortalClient,
  viewAs: string,
) {
  if (!parsed.success) return NextResponse.json({ error: "That blog was not found." }, { status: 400 });
  const saved = await supabase.from("blog_posts").update({ published: parsed.data.published }).eq("slug", parsed.data.slug);
  if (saved.error) return NextResponse.json({ error: "The blog could not be updated." }, { status: 400 });
  await supabase.rpc("record_audit", {
    p_action: parsed.data.published ? "publish_blog" : "unpublish_blog",
    p_entity: "blog_posts",
    p_entity_id: parsed.data.slug,
    p_detail: { published: parsed.data.published },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true });
}

async function uploadBanner(request: Request, supabase: PortalClient, viewAs: string) {
  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const file = form.get("file");
  if (!slug || !(file instanceof File)) return NextResponse.json({ error: "Choose a banner image." }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image." }, { status: 400 });
  }
  if (file.size > 8_000_000) return NextResponse.json({ error: "Pictures have to be under 8 MB." }, { status: 400 });
  const found = await supabase.from("blog_posts").select("slug").eq("slug", slug).maybeSingle();
  if (!found.data) return NextResponse.json({ error: "That blog was not found." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `blog/${slug}-${Date.now()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await supabase.storage.from("media").upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploaded.error) return NextResponse.json({ error: "The banner could not be saved." }, { status: 400 });
  const url = `${supabase.storage.from("media").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  const saved = await supabase.from("blog_posts").update({ banner_url: url }).eq("slug", slug);
  if (saved.error) return NextResponse.json({ error: "The banner could not be saved." }, { status: 400 });
  await supabase.rpc("record_audit", {
    p_action: "blog_banner",
    p_entity: "blog_posts",
    p_entity_id: slug,
    p_detail: { source: "upload" },
    p_view_as: viewAs,
  });
  return NextResponse.json({ ok: true, url });
}

type PortalClient = SupabaseClient;

async function productFacts(supabase: PortalClient) {
  const listed = await supabase.from("products").select("id, name, summary, detail, price_label").eq("published", true).order("sort");
  return (listed.data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    summary: product.summary,
    detail: product.detail,
    priceLabel: product.price_label,
  }));
}

async function askWriter(input: {
  supabase: PortalClient;
  mode: "article" | "banner";
  topic?: string;
  productId?: string;
  title?: string;
  excerpt?: string;
  products: { id: string; name: string; summary: string; detail: string; priceLabel: string }[];
}) {
  const { data: auth } = await input.supabase.auth.getSession();
  const token = auth.session?.access_token;
  if (!token || !supabaseUrl()) return { ok: false as const, error: "Sign in to continue.", status: 401 };
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl().replace(/\/$/, "")}/functions/v1/write-blog`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: input.mode,
        topic: input.topic ?? "",
        productId: input.productId ?? "",
        title: input.title ?? "",
        excerpt: input.excerpt ?? "",
        products: input.products,
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return { ok: false as const, error: "The draft took too long. Try the topic again.", status: 504 };
  }
  const data = await response.json().catch(() => null) as {
    error?: string;
    article?: unknown;
    bannerAlt?: string;
    imageBase64?: string;
    imageError?: string;
  } | null;
  if (!response.ok || !data) {
    return { ok: false as const, error: data?.error || "The draft could not be written.", status: response.status || 502 };
  }
  return {
    ok: true as const,
    article: data.article,
    bannerAlt: data.bannerAlt ?? "",
    imageBase64: data.imageBase64 ?? "",
    imageError: data.imageError ?? "",
  };
}

async function storeBanner(supabase: PortalClient, slug: string, imageBase64?: string) {
  if (!imageBase64) return { url: "", notice: "The draft is saved. The banner could not be created. You can add one from the post." };
  const bytes = Buffer.from(imageBase64, "base64");
  if (bytes.length < 32) return { url: "", notice: "The draft is saved. The banner could not be created. You can add one from the post." };
  const path = `blog/${slug}-${Date.now()}.png`;
  const uploaded = await supabase.storage.from("media").upload(path, bytes, { contentType: "image/png", upsert: false });
  if (uploaded.error) return { url: "", notice: "The draft is saved. The banner could not be stored. You can add one from the post." };
  const url = `${supabase.storage.from("media").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  return { url, notice: "" };
}

async function uniqueSlug(supabase: PortalClient, base: string) {
  let slug = base;
  for (let attempt = 2; attempt < 20; attempt += 1) {
    const found = await supabase.from("blog_posts").select("slug").eq("slug", slug).maybeSingle();
    if (!found.data) return slug;
    slug = `${base}-${attempt}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}
