"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Post = {
  slug: string;
  product_id?: string | null;
  title: string;
  excerpt: string;
  description: string;
  published: boolean;
  points?: string[] | null;
  banner_url?: string | null;
  banner_alt?: string | null;
  reading_minutes?: number;
  published_label?: string;
  deleted_at?: string | null;
};

type Section = {
  id: string;
  post_slug: string;
  heading: string;
  paragraphs: string[];
  deleted_at?: string | null;
};

type Product = { id: string; name: string; menu_label: string };

async function postJson(body: unknown) {
  const response = await fetch("/api/portal/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string; slug?: string; notice?: string; url?: string };
  return { ok: response.ok, ...data };
}

export function BlogDesk() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<"drafts" | "published" | "all">("drafts");
  const [topic, setTopic] = useState("");
  const [productId, setProductId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch("/api/portal/content");
    if (!response.ok) {
      setError("Blogs could not be loaded.");
      return;
    }
    const data = (await response.json()) as { posts?: Post[]; sections?: Section[]; products?: Product[] };
    setPosts(data.posts ?? []);
    setSections(data.sections ?? []);
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  const visible = posts
    .filter((post) => !post.deleted_at)
    .filter((post) => filter === "all" || (filter === "published" ? post.published : !post.published))
    .sort((left, right) => Number(left.published) - Number(right.published));

  return (
    <section className="rounded-3xl bg-white p-4">
      <h2 className="font-display text-2xl">Blogs</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        New stories start as drafts. Preview uses the public blog layout. Publish when the story is ready.
      </p>
      {error ? <p className="mt-4" role="alert">{error}</p> : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <form
        className="mt-6 grid gap-3 rounded-3xl border border-stone p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy("Writing the draft and the banner. This can take a minute.");
          setError("");
          setNotice("");
          const result = await postJson({ action: "generate", topic, productId });
          setBusy("");
          if (!result.ok) {
            setError(result.error ?? "The draft could not be written.");
            return;
          }
          setTopic("");
          setFilter("drafts");
          setNotice(result.notice || "Draft saved. Open the preview before you publish it.");
          await load();
        }}
      >
        <h3 className="font-display text-xl">New blog</h3>
        <label className="text-sm">
          Topic
          <textarea
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            required
            minLength={8}
            placeholder="How a screenless band keeps a day of activity"
            className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3"
          />
        </label>
        <label className="text-sm">
          Related product
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3"
          >
            <option value="">Technology in general</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.menu_label || product.name}</option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" disabled={Boolean(busy)}>{busy ? "Writing" : "Create draft with AI"}</Button>
        {busy ? <p className="text-sm text-muted">{busy}</p> : null}
      </form>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Blog status">
        {([
          ["drafts", "Drafts"],
          ["published", "Published"],
          ["all", "All"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold",
              filter === id ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="mt-4 text-sm text-muted">Nothing in this list yet.</p> : null}
      <ul className="mt-4 space-y-4">
        {visible.map((post) => (
          <BlogCard
            key={post.slug}
            post={post}
            sections={sections.filter((section) => section.post_slug === post.slug && !section.deleted_at)}
            busy={busy}
            onBusy={setBusy}
            onError={setError}
            onNotice={setNotice}
            onReload={load}
          />
        ))}
      </ul>
    </section>
  );
}

function BlogCard({
  post,
  sections,
  busy,
  onBusy,
  onError,
  onNotice,
  onReload,
}: {
  post: Post;
  sections: Section[];
  busy: string;
  onBusy: (value: string) => void;
  onError: (value: string) => void;
  onNotice: (value: string) => void;
  onReload: () => Promise<void>;
}) {
  return (
    <li className="rounded-3xl border border-stone p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("rounded-full px-3 py-1 text-xs font-bold", post.published ? "bg-ink text-paper" : "bg-coral text-ink")}>
          {post.published ? "Published" : "Draft"}
        </p>
        <div className="flex flex-wrap gap-2">
          <a className="inline-flex min-h-11 items-center text-sm font-bold underline" href={`/blog/preview/${post.slug}`} target="_blank" rel="noreferrer">
            Preview
          </a>
          <Button
            type="button"
            size="sm"
            disabled={Boolean(busy)}
            onClick={async () => {
              onError("");
              const result = await postJson({ action: "publish", slug: post.slug, published: !post.published });
              if (!result.ok) onError(result.error ?? "The blog could not be updated.");
              else onNotice(post.published ? "Moved back to drafts." : "Published on the blog.");
              await onReload();
            }}
          >
            {post.published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>
      {post.banner_url ? (
        <div className="relative mt-4 aspect-[16/7] overflow-hidden rounded-2xl bg-[var(--joova-white)]">
          <Image src={post.banner_url} alt={post.banner_alt || post.title} fill sizes="800px" className="object-cover" />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">No banner yet.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={Boolean(busy)}
          onClick={async () => {
            onBusy("Creating a new banner.");
            onError("");
            const result = await postJson({ action: "banner", slug: post.slug });
            onBusy("");
            if (!result.ok) onError(result.error ?? "The banner could not be created.");
            else onNotice("Banner updated.");
            await onReload();
          }}
        >
          New banner with AI
        </Button>
        <FilePicker
          label="Replace banner"
          hint="Or choose your own image."
          accept="image/jpeg,image/png,image/webp"
          disabled={Boolean(busy)}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            onBusy("Saving the banner.");
            onError("");
            const form = new FormData();
            form.set("slug", post.slug);
            form.set("file", file);
            const response = await fetch("/api/portal/blogs", { method: "POST", body: form });
            const data = (await response.json()) as { error?: string };
            onBusy("");
            if (!response.ok) onError(data.error ?? "The banner could not be saved.");
            else onNotice("Banner updated.");
            await onReload();
          }}
        />
      </div>
      <form
        className="mt-4 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const response = await fetch("/api/portal/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "blog",
              slug: post.slug,
              title: String(form.get("title") ?? ""),
              excerpt: String(form.get("excerpt") ?? ""),
              description: String(form.get("description") ?? ""),
              points: String(form.get("points") ?? ""),
              bannerAlt: String(form.get("bannerAlt") ?? ""),
              published: post.published,
            }),
          });
          const data = (await response.json()) as { error?: string };
          if (!response.ok) onError(data.error ?? "The blog could not be saved.");
          else onNotice("Story saved.");
          await onReload();
        }}
      >
        <label className="text-sm">Title<Input className="mt-2" name="title" defaultValue={post.title} required /></label>
        <label className="text-sm">
          Excerpt
          <textarea name="excerpt" defaultValue={post.excerpt} required className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">
          Description
          <textarea name="description" defaultValue={post.description} required className="mt-2 min-h-20 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">
          In short, one point per line
          <textarea name="points" defaultValue={(post.points ?? []).join("\n")} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
        </label>
        <label className="text-sm">Banner description<Input className="mt-2" name="bannerAlt" defaultValue={post.banner_alt ?? ""} /></label>
        <Button type="submit" size="sm">Save story</Button>
      </form>
      <ul className="mt-4 space-y-3">
        {sections.map((section) => (
          <li key={section.id}>
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const response = await fetch("/api/portal/content", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    kind: "section",
                    id: section.id,
                    heading: String(form.get("heading") ?? ""),
                    paragraphs: String(form.get("paragraphs") ?? ""),
                  }),
                });
                const data = (await response.json()) as { error?: string };
                if (!response.ok) onError(data.error ?? "The section could not be saved.");
                else onNotice("Section saved.");
                await onReload();
              }}
            >
              <label className="text-sm">Section heading<Input className="mt-2" name="heading" defaultValue={section.heading} required /></label>
              <label className="text-sm">
                Paragraphs, separated by a blank line
                <textarea name="paragraphs" defaultValue={(section.paragraphs ?? []).join("\n\n")} required className="mt-2 min-h-28 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
              </label>
              <Button type="submit" size="sm">Save section</Button>
            </form>
          </li>
        ))}
      </ul>
      <ResourceDelete table="blog_posts" id={post.slug} removed={Boolean(post.deleted_at)} onDone={() => void onReload()} />
    </li>
  );
}
