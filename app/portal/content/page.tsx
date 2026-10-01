import { ContentDesk } from "@/components/portal/content-desk";
import { ContentTabs, contentSection, type ContentCounts } from "@/components/portal/content-tabs";
import { requirePortalPage } from "@/lib/portal/session";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; section?: string }>;
}) {
  const session = await requirePortalPage("content");
  const params = await searchParams;
  const { tab, section } = contentSection(params.tab, params.section);
  const counts = await contentCounts(session.supabase);
  return (
    <>
      <h1 className="font-display text-3xl">Content</h1>
      <p className="mt-2 text-muted">Choose a category. Prices and stock stay in Inventory.</p>
      <ContentTabs tab={tab} section={section} counts={counts} />
      <ContentDesk section={section} />
    </>
  );
}

async function contentCounts(supabase: Awaited<ReturnType<typeof requirePortalPage>>["supabase"]): Promise<ContentCounts> {
  const [posts, videos, help, blocks, reviews, links, channels, header, footer, media] = await Promise.all([
    supabase.from("blog_posts").select("slug", { count: "exact", head: true }),
    supabase.from("videos").select("id", { count: "exact", head: true }),
    supabase.from("help_articles").select("slug", { count: "exact", head: true }),
    supabase.from("product_blocks").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("support_links").select("href", { count: "exact", head: true }),
    supabase.from("support_channels").select("id", { count: "exact", head: true }),
    supabase.from("nav_items").select("id", { count: "exact", head: true }).eq("area", "header"),
    supabase.from("nav_items").select("id", { count: "exact", head: true }).eq("area", "footer"),
    supabase.storage.from("media").list("", { limit: 100 }),
  ]);
  let devices = 0;
  if (isServiceRoleConfigured()) {
    const listed = await createAdminClient().from("warranty_registrations").select("id", { count: "exact", head: true }).is("deleted_at", null);
    devices = listed.count ?? 0;
  }
  return {
    blog: posts.count ?? 0,
    videos: videos.count ?? 0,
    help: help.count ?? 0,
    blocks: blocks.count ?? 0,
    reviews: reviews.count ?? 0,
    "support-menu": links.count ?? 0,
    "support-channels": channels.count ?? 0,
    header: header.count ?? 0,
    footer: footer.count ?? 0,
    media: media.data?.filter((file) => file.name && file.id).length ?? 0,
    warranty: devices,
  };
}
