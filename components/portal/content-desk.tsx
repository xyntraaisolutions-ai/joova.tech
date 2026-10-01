"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ResourceDelete } from "@/components/portal/resource-delete";
import { WarrantyDesk } from "@/components/portal/warranty-desk";
import { noticeBackgrounds, noticeFontColors } from "@/content/site";
import { Button } from "@/components/ui/button";
import { FilePicker } from "@/components/ui/file-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ContentData = {
  settings?: Record<string, string> | null;
  policies?: Record<string, string> | null;
  pages?: { page: string; key: string; value: string; deleted_at?: string | null }[];
  posts?: { slug: string; title: string; excerpt: string; description: string; published: boolean; deleted_at?: string | null }[];
  videos?: { id: string; product_id: string; title: string; youtube_id: string; published: boolean; deleted_at?: string | null }[];
  help?: { slug: string; title: string; summary: string; body: string; published: boolean; deleted_at?: string | null }[];
  social?: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
  channels?: { id: string; label: string; reply: string; href: string | null; deleted_at?: string | null }[];
  blocks?: { id: string; payload: unknown; deleted_at?: string | null }[];
  reviews?: { id: string; product_id: string; author: string; body: string; published: boolean; deleted_at?: string | null }[];
  sections?: { id: string; post_slug: string; heading: string; paragraphs: string[]; deleted_at?: string | null }[];
  links?: { href: string; label: string; deleted_at?: string | null }[];
  nav?: NavRow[];
  payments?: { id: string; label: string; offered?: boolean; deleted_at?: string | null }[];
  stores?: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
};

async function save(body: unknown) {
  const response = await fetch("/api/portal/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string };
  return response.ok ? "" : data.error ?? "That content could not be saved.";
}

export function ContentDesk({ section }: { section: string }) {
  const [data, setData] = useState<ContentData>({});
  const [error, setError] = useState("");
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  async function load() {
    const response = await fetch("/api/portal/content");
    if (!response.ok) {
      setError("Content could not be loaded.");
      return;
    }
    setData((await response.json()) as ContentData);
    const media = await fetch("/api/portal/media");
    if (media.ok) {
      const body = (await media.json()) as { files?: { name: string; url: string }[] };
      setFiles(body.files ?? []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const settings = data.settings ?? {};
  const policies = data.policies ?? {};
  const pageName = section.startsWith("page:") ? section.slice(5) : "";

  return (
    <div className="mt-6">
      {error ? <p role="alert">{error}</p> : null}
      <Section id="settings" active={section}>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Site settings</h2>
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(await save({
              kind: "settings",
              announcement: String(form.get("announcement") ?? ""),
              siteDescription: String(form.get("siteDescription") ?? ""),
              email: String(form.get("email") ?? ""),
              supportHours: String(form.get("supportHours") ?? ""),
              siteUrl: String(form.get("siteUrl") ?? ""),
              brand: String(form.get("brand") ?? ""),
              address: String(form.get("address") ?? ""),
              noSubscription: String(form.get("noSubscription") ?? ""),
            }));
          }}
        >
          <Field name="brand" label="Brand" defaultValue={settings.brand} />
          <Field name="address" label="Address" defaultValue={settings.address} />
          <Field name="email" label="Support email" defaultValue={settings.email} />
          <Field name="supportHours" label="Support hours" defaultValue={settings.support_hours} />
          <Field name="announcement" label="Announcement" defaultValue={settings.announcement} />
          <Field name="siteDescription" label="Site description" defaultValue={settings.site_description} />
          <Field name="noSubscription" label="No-subscription line" defaultValue={settings.no_subscription} />
          <Field name="siteUrl" label="Public site URL" defaultValue={settings.site_url ?? "http://127.0.0.1:3000"} />
          <Button type="submit" size="sm">Save settings</Button>
        </form>
      </section>
      </Section>

      <Section id="policies" active={section}>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Policies</h2>
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(await save({
              kind: "policies",
              shipping: String(form.get("shipping") ?? ""),
              returnsSummary: String(form.get("returnsSummary") ?? ""),
              warrantyRegistration: String(form.get("warrantyRegistration") ?? ""),
              accountSummary: String(form.get("accountSummary") ?? ""),
              heroLine: String(form.get("heroLine") ?? ""),
              returnsTitle: String(form.get("returnsTitle") ?? ""),
              strapTitle: String(form.get("strapTitle") ?? ""),
              dockTitle: String(form.get("dockTitle") ?? ""),
              strapSummary: String(form.get("strapSummary") ?? ""),
              dockSummary: String(form.get("dockSummary") ?? ""),
            }));
          }}
        >
          <Area name="shipping" label="Shipping" defaultValue={policies.shipping} />
          <Area name="returnsSummary" label="Returns" defaultValue={policies.returns_summary} />
          <Area name="warrantyRegistration" label="Warranty registration" defaultValue={policies.warranty_registration} />
          <Area name="accountSummary" label="Account summary" defaultValue={policies.account_summary} />
          <Field name="heroLine" label="Hero line" defaultValue={policies.hero_line} />
          <Field name="returnsTitle" label="Returns title" defaultValue={policies.returns_title} />
          <Field name="strapTitle" label="Strap title" defaultValue={policies.strap_title} />
          <Field name="dockTitle" label="Dock title" defaultValue={policies.dock_title} />
          <Area name="strapSummary" label="Strap summary" defaultValue={policies.strap_summary} />
          <Area name="dockSummary" label="Dock summary" defaultValue={policies.dock_summary} />
          <Button type="submit" size="sm">Save policies</Button>
        </form>
      </section>
      </Section>

      <Section id="warranty" active={section}>
      <WarrantyDesk />
      </Section>

      {pageName ? (
        <Section id={`page:${pageName}`} active={section}>
          <h2 className="font-display text-2xl">{pageLabel(pageName)}</h2>
          <ul className="mt-4 space-y-3">
            {(data.pages ?? []).filter((page) => page.page === pageName).map((page) => (
            <li key={`${page.page}-${page.key}`}>
              <form
                className="rounded-3xl bg-white p-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({ kind: "page", page: page.page, key: page.key, value: String(form.get("value") ?? "") }));
                }}
              >
                <p className="text-sm text-muted">{page.page} · {page.key}</p>
                <textarea name="value" defaultValue={page.value} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" />
                <Button className="mt-3" type="submit" size="sm">Save</Button>
              </form>
              <ResourceDelete table="page_copy" id={`${page.page}::${page.key}`} removed={Boolean(page.deleted_at)} onDone={() => void load()} />
            </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="blog" active={section}>
        <h2 className="font-display text-2xl">Blog</h2>
        <ul className="mt-4 space-y-3">
          {(data.posts ?? []).map((post) => (
            <li key={post.slug} className="rounded-3xl bg-white p-4">
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({
                    kind: "blog",
                    slug: post.slug,
                    title: String(form.get("title") ?? ""),
                    excerpt: String(form.get("excerpt") ?? ""),
                    description: String(form.get("description") ?? ""),
                    published: form.get("published") === "on",
                  }));
                }}
              >
                <Field name="title" label={post.slug} defaultValue={post.title} />
                <Area name="excerpt" label="Excerpt" defaultValue={post.excerpt} />
                <Area name="description" label="Description" defaultValue={post.description} />
                <label className="text-sm"><input type="checkbox" name="published" defaultChecked={post.published} /> Published</label>
                <Button type="submit" size="sm">Save post</Button>
              </form>
              <ResourceDelete table="blog_posts" id={post.slug} removed={Boolean(post.deleted_at)} onDone={() => void load()} />
              <ul className="mt-4 space-y-3">
                {(data.sections ?? []).filter((section) => section.post_slug === post.slug).map((section) => (
                  <li key={section.id}>
                    <form
                      className="grid gap-3"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const form = new FormData(event.currentTarget);
                        setError(await save({
                          kind: "section",
                          id: section.id,
                          heading: String(form.get("heading") ?? ""),
                          paragraphs: String(form.get("paragraphs") ?? ""),
                        }));
                      }}
                    >
                      <Field name="heading" label="Section heading" defaultValue={section.heading} />
                      <Area name="paragraphs" label="Paragraphs, separated by a blank line" defaultValue={(section.paragraphs ?? []).join("\n\n")} />
                      <Button type="submit" size="sm">Save section</Button>
                    </form>
                    <ResourceDelete table="blog_sections" id={section.id} removed={Boolean(section.deleted_at)} onDone={() => void load()} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="videos" active={section}>
        <h2 className="font-display text-2xl">Videos</h2>
        <ul className="mt-4 space-y-3">
          {(data.videos ?? []).map((video) => (
            <li key={video.id} className="rounded-3xl bg-white p-4">
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({
                    kind: "video",
                    id: video.id,
                    productId: String(form.get("productId") ?? ""),
                    title: String(form.get("title") ?? ""),
                    youtubeId: String(form.get("youtubeId") ?? ""),
                    published: form.get("published") === "on",
                  }));
                }}
              >
                <Field name="title" label="Video title" defaultValue={video.title} />
                <Field name="productId" label="Product id" defaultValue={video.product_id} />
                <Field name="youtubeId" label="YouTube id" defaultValue={video.youtube_id} />
                <label className="text-sm"><input type="checkbox" name="published" defaultChecked={video.published} /> Published</label>
                <Button type="submit" size="sm">Save video</Button>
              </form>
              <ResourceDelete table="videos" id={video.id} removed={Boolean(video.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="help" active={section}>
        <h2 className="font-display text-2xl">Help</h2>
        <ul className="mt-4 space-y-3">
          {(data.help ?? []).map((article) => (
            <li key={article.slug} className="rounded-3xl bg-white p-4">
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({
                    kind: "help",
                    slug: article.slug,
                    title: String(form.get("title") ?? ""),
                    summary: String(form.get("summary") ?? ""),
                    body: String(form.get("body") ?? ""),
                    published: form.get("published") === "on",
                  }));
                }}
              >
                <Field name="title" label={article.slug} defaultValue={article.title} />
                <Area name="summary" label="Summary" defaultValue={article.summary} />
                <Area name="body" label="Body" defaultValue={article.body} />
                <label className="text-sm"><input type="checkbox" name="published" defaultChecked={article.published} /> Published</label>
                <Button type="submit" size="sm">Save article</Button>
              </form>
              <ResourceDelete table="help_articles" id={article.slug} removed={Boolean(article.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="media" active={section}>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Media</h2>
        <form
          className="mt-4 flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const response = await fetch("/api/portal/media", { method: "POST", body: form });
            const body = (await response.json()) as { error?: string };
            setError(response.ok ? "" : body.error ?? "The file could not be uploaded.");
            if (response.ok) void load();
          }}
        >
          <div className="text-sm">
            <p>File</p>
            <FilePicker className="mt-2" label="Choose file" name="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" required />
          </div>
          <Button type="submit" size="sm">Upload</Button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {files.map((file) => (
            <li key={file.name}>
              <a className="underline" href={file.url}>{file.name}</a>
            </li>
          ))}
        </ul>
      </section>
      </Section>

      <Section id="header" active={section}>
        <HeaderChrome settings={settings} onError={setError} />
        <div className="mt-8">
          <NavEditor area="header" items={data.nav ?? []} onError={setError} onDone={() => void load()} />
        </div>
      </Section>

      <Section id="footer" active={section}>
        <FooterEditor
          settings={settings}
          payments={data.payments ?? []}
          social={data.social ?? []}
          stores={data.stores ?? []}
          nav={data.nav ?? []}
          onError={setError}
          onDone={() => void load()}
        />
      </Section>

      <Section id="support-menu" active={section}>
        <h2 className="font-display text-2xl">Support menu</h2>
        <p className="mt-2 text-sm text-muted">The header Support menu is edited under Menus, Header.</p>
        <ul className="mt-4 space-y-3">
          {(data.links ?? []).map((link) => (
            <li key={link.href} className="rounded-3xl bg-white p-4">
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({ kind: "supportLink", href: link.href, label: String(form.get("label") ?? "") }));
                }}
              >
                <Field name="label" label={link.href} defaultValue={link.label} />
                <Button type="submit" size="sm">Save menu label</Button>
              </form>
              <ResourceDelete table="support_links" id={link.href} removed={Boolean(link.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="support-channels" active={section}>
        <h2 className="font-display text-2xl">Reply times</h2>
        <ul className="mt-4 space-y-3">
          {(data.channels ?? []).map((channel) => (
            <li key={channel.id} className="rounded-3xl bg-white p-4">
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const href = String(form.get("href") ?? "");
                  setError(await save({
                    kind: "channel",
                    id: channel.id,
                    label: String(form.get("label") ?? ""),
                    reply: String(form.get("reply") ?? ""),
                    href: href || null,
                  }));
                }}
              >
                <Field name="label" label="Channel" defaultValue={channel.label} />
                <Field name="reply" label="Reply time" defaultValue={channel.reply} />
                <Field name="href" label="Link" defaultValue={channel.href ?? ""} />
                <Button type="submit" size="sm">Save channel</Button>
              </form>
              <ResourceDelete table="support_channels" id={channel.id} removed={Boolean(channel.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </Section>

      <Section id="blocks" active={section}>
      <section>
        <h2 className="font-display text-2xl">Content blocks</h2>
        <ul className="mt-4 space-y-3">
          {(data.blocks ?? []).map((block) => (
            <li key={block.id} className="rounded-3xl bg-white p-4">
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  setError(await save({ kind: "block", id: block.id, payload: String(form.get("payload") ?? "") }));
                }}
              >
                <p className="text-sm font-bold">{block.id}</p>
                <textarea name="payload" defaultValue={JSON.stringify(block.payload, null, 2)} className="mt-2 min-h-36 w-full rounded-2xl border border-stone bg-white px-4 py-3 font-mono text-sm" />
                <Button className="mt-3" type="submit" size="sm">Save block</Button>
              </form>
              <ResourceDelete table="product_blocks" id={block.id} removed={Boolean(block.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </section>
      </Section>

      <Section id="reviews" active={section}>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-2xl">Reviews</h2>
        <p className="mt-2 text-sm text-muted">The public reviews page stays empty until 10 real reviews are published. Do not invent ratings.</p>
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(await save({
              kind: "review",
              productId: String(form.get("productId") ?? ""),
              author: String(form.get("author") ?? ""),
              body: String(form.get("body") ?? ""),
              verified: form.get("verified") === "on",
              published: form.get("published") === "on",
            }));
            if (!error) void load();
          }}
        >
          <Field name="productId" label="Product id" defaultValue="band" />
          <Field name="author" label="Author" defaultValue="" />
          <Area name="body" label="Review" defaultValue="" />
          <label className="text-sm"><input type="checkbox" name="verified" /> Verified purchase</label>
          <label className="text-sm"><input type="checkbox" name="published" /> Published</label>
          <Button type="submit" size="sm">Save review</Button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {(data.reviews ?? []).map((review) => (
            <li key={review.id}>
              {review.author} on {review.product_id}: {review.body}
              {review.published ? " · Published" : " · Waiting"}
              {review.published ? null : (
                <Button
                  className="ml-2"
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void save({ kind: "reviewPublish", id: review.id, published: true }).then((message) => {
                    setError(message);
                    if (!message) void load();
                  })}
                >
                  Publish
                </Button>
              )}
              <ResourceDelete table="reviews" id={review.id} removed={Boolean(review.deleted_at)} onDone={() => void load()} />
            </li>
          ))}
        </ul>
      </section>
      </Section>

    </div>
  );
}

function ColorChoices({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: readonly { id: string; label: string; value: string }[];
  defaultValue: string;
}) {
  const selected = options.some((option) => option.id === defaultValue) ? defaultValue : options[0]?.id;
  return (
    <fieldset>
      <legend className="text-sm font-bold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.id} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone px-3 text-sm">
            <input type="radio" name={name} value={option.id} defaultChecked={option.id === selected} />
            <span className="size-4 rounded-full border border-stone" style={{ background: option.value }} aria-hidden />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function enabledSetting(settings: Record<string, string> | null | undefined, key: string) {
  const value = (settings as Record<string, unknown> | null | undefined)?.[key];
  return value !== false && value !== "false";
}

function HeaderChrome({ settings, onError }: { settings: Record<string, string>; onError: (message: string) => void }) {
  return (
    <section className="rounded-3xl bg-white p-4">
      <h2 className="font-display text-2xl">Header</h2>
      <p className="mt-2 text-sm text-muted">The two notices sit above the menu. Each one can be turned off without deleting the words.</p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onError(await save({
            kind: "headerChrome",
            noticePrimary: String(form.get("noticePrimary") ?? ""),
            noticePrimaryEnabled: form.get("noticePrimaryEnabled") === "on",
            noticePrimaryColor: String(form.get("noticePrimaryColor") ?? "red"),
            noticePrimaryBackground: String(form.get("noticePrimaryBackground") ?? "ink"),
            noticeSecondary: String(form.get("noticeSecondary") ?? ""),
            noticeSecondaryEnabled: form.get("noticeSecondaryEnabled") === "on",
            noticeSecondaryColor: String(form.get("noticeSecondaryColor") ?? "white"),
            noticeSecondaryBackground: String(form.get("noticeSecondaryBackground") ?? "ink"),
            headerSlogan: String(form.get("headerSlogan") ?? ""),
          }));
        }}
      >
        <Field name="noticePrimary" label="Top notice" optional defaultValue={String((settings as Record<string, unknown>).notice_primary ?? "This Website is in Development Phase")} />
        <label className="text-sm">
          <input type="checkbox" name="noticePrimaryEnabled" defaultChecked={enabledSetting(settings, "notice_primary_enabled")} /> Show top notice
        </label>
        <ColorChoices
          name="noticePrimaryColor"
          legend="Top notice font"
          options={noticeFontColors}
          defaultValue={String((settings as Record<string, unknown>).notice_primary_color ?? "red")}
        />
        <ColorChoices
          name="noticePrimaryBackground"
          legend="Top notice background"
          options={noticeBackgrounds}
          defaultValue={String((settings as Record<string, unknown>).notice_primary_background ?? "ink")}
        />
        <Field name="noticeSecondary" label="Shipping notice" optional defaultValue={String((settings as Record<string, unknown>).notice_secondary ?? settings.announcement ?? "")} />
        <label className="text-sm">
          <input type="checkbox" name="noticeSecondaryEnabled" defaultChecked={enabledSetting(settings, "notice_secondary_enabled")} /> Show shipping notice
        </label>
        <ColorChoices
          name="noticeSecondaryColor"
          legend="Shipping notice font"
          options={noticeFontColors}
          defaultValue={String((settings as Record<string, unknown>).notice_secondary_color ?? "white")}
        />
        <ColorChoices
          name="noticeSecondaryBackground"
          legend="Shipping notice background"
          options={noticeBackgrounds}
          defaultValue={String((settings as Record<string, unknown>).notice_secondary_background ?? "ink")}
        />
        <Field name="headerSlogan" label="Slogan under the wordmark" defaultValue={String((settings as Record<string, unknown>).header_slogan ?? "Smarter Tech | Bigger Tomorrow")} />
        <Button type="submit" size="sm">Save header</Button>
      </form>
    </section>
  );
}

const footerTabs = [
  { id: "words", label: "Words" },
  { id: "links", label: "Links" },
  { id: "stores", label: "Stores" },
  { id: "payments", label: "Payments" },
  { id: "social", label: "Social" },
] as const;

function FooterEditor({
  settings,
  payments,
  social,
  stores,
  nav,
  onError,
  onDone,
}: {
  settings: Record<string, string>;
  payments: { id: string; label: string; offered?: boolean; deleted_at?: string | null }[];
  social: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
  stores: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
  nav: NavRow[];
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<(typeof footerTabs)[number]["id"]>("words");
  return (
    <div>
      <h2 className="font-display text-2xl">Footer</h2>
      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Footer">
        {footerTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-bold",
              tab === item.id ? "bg-ink text-paper" : "border border-stone text-ink",
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6" hidden={tab !== "words"}>
        <FooterChrome settings={settings} onError={onError} />
      </div>
      <div className="mt-6" hidden={tab !== "links"}>
        <NavEditor area="footer" items={nav} onError={onError} onDone={onDone} />
      </div>
      <div className="mt-6" hidden={tab !== "stores"}>
        <FooterStores stores={stores} onError={onError} onDone={onDone} />
      </div>
      <div className="mt-6" hidden={tab !== "payments"}>
        <FooterPayments payments={payments} onError={onError} onDone={onDone} />
      </div>
      <div className="mt-6" hidden={tab !== "social"}>
        <FooterSocial social={social} onError={onError} onDone={onDone} />
      </div>
    </div>
  );
}

function FooterChrome({ settings, onError }: { settings: Record<string, string>; onError: (message: string) => void }) {
  return (
    <section className="rounded-3xl bg-white p-4">
      <h3 className="font-display text-2xl">Words</h3>
      <p className="mt-2 text-sm text-muted">The brand sentence and company details. The slogan sits on the next line under the brand sentence. Store links are on the Stores tab.</p>
      <form
        className="mt-4 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onError(await save({
            kind: "footerChrome",
            footerBlurb: String(form.get("footerBlurb") ?? ""),
            footerMarketplaces: String((settings as Record<string, unknown>).footer_marketplaces ?? ""),
            legalName: String(form.get("legalName") ?? ""),
            address: String(form.get("address") ?? ""),
            copyright: String(form.get("copyright") ?? ""),
          }));
        }}
      >
        <Area name="footerBlurb" label="Brand paragraph" defaultValue={String((settings as Record<string, unknown>).footer_blurb ?? "")} />
        <Field name="legalName" label="Legal name" defaultValue={settings.legal_name} />
        <Field name="address" label="Address" defaultValue={settings.address} />
        <Field name="copyright" label="Copyright" defaultValue={settings.copyright} />
        <Button type="submit" size="sm">Save footer</Button>
      </form>
    </section>
  );
}

function FooterStores({
  stores,
  onError,
  onDone,
}: {
  stores: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const rows = stores.filter((store) => !store.deleted_at);
  return (
    <div className="grid gap-6">
      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl">Stores</h3>
        <p className="mt-2 text-sm text-muted">These appear on the next line under the business address. Turn a store on to show it, and add its page link when that page is ready.</p>
        <form
          className="mt-4 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = await save({
              kind: "footerStores",
              stores: rows.map((store) => ({
                id: store.id,
                href: String(form.get(`href:${store.id}`) ?? ""),
                enabled: form.get(`enabled:${store.id}`) === "on",
              })),
            });
            onError(message);
            if (!message) onDone();
          }}
        >
          {rows.map((store) => (
            <div key={store.id} className="grid gap-3 rounded-2xl border border-stone p-3">
              <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                <input type="checkbox" name={`enabled:${store.id}`} defaultChecked={store.enabled !== false} />
                Show {store.label}
              </label>
              <Field name={`href:${store.id}`} label={`${store.label} link`} optional defaultValue={store.href} />
            </div>
          ))}
          <Button type="submit" size="sm">Save stores</Button>
        </form>
      </section>
      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-bold">Add a store</h3>
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = await save({
              kind: "footerStoreAdd",
              label: String(form.get("label") ?? ""),
              href: String(form.get("href") ?? ""),
              enabled: form.get("enabled") === "on",
            });
            onError(message);
            if (!message) {
              event.currentTarget.reset();
              onDone();
            }
          }}
        >
          <Field name="label" label="Store name" />
          <Field name="href" label="Store link" optional />
          <label className="text-sm">
            <input type="checkbox" name="enabled" defaultChecked /> Show in the footer
          </label>
          <Button type="submit" size="sm">Add store</Button>
        </form>
      </section>
    </div>
  );
}

function FooterPayments({
  payments,
  onError,
  onDone,
}: {
  payments: { id: string; label: string; offered?: boolean; deleted_at?: string | null }[];
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const methods = payments.filter((method) => !method.deleted_at);
  return (
      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl">Payment methods</h3>
        <p className="mt-2 text-sm text-muted">Check each method Joova accepts. Only the checked marks appear in the footer.</p>
        <form
          className="mt-4 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = await save({ kind: "footerPayments", offered: form.getAll("offered").map(String) });
            onError(message);
            if (!message) onDone();
          }}
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {methods.map((method) => (
              <li key={method.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-stone px-3 text-sm">
                  <input type="checkbox" name="offered" value={method.id} defaultChecked={method.offered !== false} />
                  {method.label}
                </label>
              </li>
            ))}
          </ul>
          <Button type="submit" size="sm">Save payments</Button>
        </form>
      </section>
  );
}

function FooterSocial({
  social,
  onError,
  onDone,
}: {
  social: { id: string; label: string; href: string; enabled?: boolean; deleted_at?: string | null }[];
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const links = social.filter((link) => !link.deleted_at);
  return (
      <section className="rounded-3xl bg-white p-4">
        <h3 className="font-display text-2xl">Social media</h3>
        <p className="mt-2 text-sm text-muted">Turn a platform on to show its icon, and set the page it opens.</p>
        <form
          className="mt-4 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const message = await save({
              kind: "footerSocial",
              links: links.map((link) => ({
                id: link.id,
                href: String(form.get(`href:${link.id}`) ?? ""),
                enabled: form.get(`enabled:${link.id}`) === "on",
              })),
            });
            onError(message);
            if (!message) onDone();
          }}
        >
          {links.map((link) => (
            <div key={link.id} className="grid gap-3 rounded-2xl border border-stone p-3">
              <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                <input type="checkbox" name={`enabled:${link.id}`} defaultChecked={link.enabled !== false} />
                Show {link.label}
              </label>
              <Field name={`href:${link.id}`} label={`${link.label} link`} defaultValue={link.href} />
            </div>
          ))}
          <Button type="submit" size="sm">Save social</Button>
        </form>
      </section>
  );
}

type NavRow = {
  id: string;
  area: "header" | "footer";
  parent_id: string | null;
  kind: "link" | "menu" | "products";
  label: string;
  href: string;
  sort: number;
  published: boolean;
  deleted_at?: string | null;
};

function NavEditor({
  area,
  items,
  onError,
  onDone,
}: {
  area: "header" | "footer";
  items: NavRow[];
  onError: (message: string) => void;
  onDone: () => void;
}) {
  const rows = items.filter((item) => item.area === area);
  const parents = rows.filter((item) => !item.parent_id);
  const title = area === "header" ? "Header" : "Link columns";

  function nextId(label: string) {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
    const base = `${area}-${slug || "item"}`;
    let id = base;
    let count = 2;
    while (items.some((item) => item.id === id)) {
      id = `${base}-${count}`;
      count += 1;
    }
    return id.slice(0, 80);
  }

  async function submit(form: FormData, id: string) {
    const parent = String(form.get("parentId") ?? "");
    onError(await save({
      kind: "nav",
      id,
      area,
      parentId: parent || null,
      itemKind: String(form.get("itemKind") ?? "link"),
      label: String(form.get("label") ?? ""),
      href: String(form.get("href") ?? ""),
      sort: Number(form.get("sort") ?? 0),
      published: form.get("published") === "on",
    }));
    onDone();
  }

  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">
        {area === "header"
          ? "Shop, deals, products, and the other links across the top of the site. A menu holds the links under it. Products opens the category list."
          : "The link columns at the bottom of the site. A menu is a column title. Links under it are the column items."}
      </p>
      <form
        className="mt-4 grid gap-3 rounded-3xl bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          await submit(form, nextId(String(form.get("label") ?? "")));
          event.currentTarget.reset();
        }}
      >
        <h3 className="font-bold">Add item</h3>
        <Field name="label" label="Label" />
        <Field name="href" label="Path" />
        <label className="block text-sm">
          Kind
          <select name="itemKind" className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3" defaultValue="link">
            <option value="link">Link</option>
            <option value="menu">Menu</option>
            {area === "header" ? <option value="products">Products</option> : null}
          </select>
        </label>
        <label className="block text-sm">
          Under
          <select name="parentId" className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3" defaultValue="">
            <option value="">Top level</option>
            {parents.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Order
          <Input className="mt-2" name="sort" type="number" min={0} max={999} defaultValue={rows.length} />
        </label>
        <label className="text-sm"><input type="checkbox" name="published" defaultChecked /> Published</label>
        <Button type="submit" size="sm">Add item</Button>
      </form>
      <ul className="mt-4 space-y-3">
        {rows.map((item) => (
          <li key={item.id} className="rounded-3xl bg-white p-4">
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await submit(new FormData(event.currentTarget), item.id);
              }}
            >
              <p className="text-sm text-muted">{item.id}</p>
              <Field name="label" label="Label" defaultValue={item.label} />
              <Field name="href" label="Path" defaultValue={item.href} />
              <label className="block text-sm">
                Kind
                <select name="itemKind" className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3" defaultValue={item.kind}>
                  <option value="link">Link</option>
                  <option value="menu">Menu</option>
                  {area === "header" ? <option value="products">Products</option> : null}
                </select>
              </label>
              <label className="block text-sm">
                Under
                <select name="parentId" className="mt-2 w-full rounded-2xl border border-stone bg-white px-4 py-3" defaultValue={item.parent_id ?? ""}>
                  <option value="">Top level</option>
                  {parents.filter((parent) => parent.id !== item.id).map((parent) => (
                    <option key={parent.id} value={parent.id}>{parent.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Order
                <Input className="mt-2" name="sort" type="number" min={0} max={999} defaultValue={item.sort} />
              </label>
              <label className="text-sm">
                <input type="checkbox" name="published" defaultChecked={item.published} /> Published
              </label>
              <Button type="submit" size="sm">Save item</Button>
            </form>
            <ResourceDelete table="nav_items" id={item.id} removed={Boolean(item.deleted_at)} onDone={onDone} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({ id, active, children }: { id: string; active: string; children: ReactNode }) {
  if (id !== active) return null;
  return <div>{children}</div>;
}

function pageLabel(page: string) {
  const labels: Record<string, string> = {
    about: "About",
    privacy: "Privacy",
    terms: "Terms",
    accessibility: "Accessibility",
    returns: "Returns",
    warranty: "Warranty page",
  };
  return labels[page] ?? page.charAt(0).toUpperCase() + page.slice(1);
}

function Field({ name, label, defaultValue, optional = false }: { name: string; label: string; defaultValue?: string; optional?: boolean }) {
  return (
    <label className="block text-sm">
      {label}
      <Input className="mt-2" name={name} defaultValue={defaultValue ?? ""} required={!optional && name !== "href"} />
    </label>
  );
}

function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <textarea name={name} defaultValue={defaultValue ?? ""} className="mt-2 min-h-24 w-full rounded-2xl border border-stone bg-white px-4 py-3" required />
    </label>
  );
}
